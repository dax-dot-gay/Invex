use std::{
    io::Write, ops::{Deref, DerefMut}
};

use bevy_reflect::{Reflect, TypeRegistration, Typed};
use convert_case::{Case, Casing};
use mongodb::{
    bson::{self, doc, Bson},
    gridfs::{GridFsBucket, GridFsDownloadStream, GridFsUploadStream},
    options::GridFsBucketOptions,
    Collection, Database,
};
use rocket::{
    data::ToByteUnit,
    form::{self, DataField, FromFormField},
    futures::{AsyncReadExt as _, AsyncWriteExt as _, TryStreamExt},
    http::Status,
    request::{FromRequest, Outcome},
    tokio::io::AsyncReadExt,
    Request,
};
use serde::{de::DeserializeOwned, Deserialize, Serialize};
use tempfile::NamedTempFile;
use uuid::Uuid;

use crate::models::error::ApiError;

use super::InResult;

#[derive(Serialize, Clone)]
pub struct PaginationResult<T: Serialize + Clone> {
    pub offset: u64,
    pub total: u64,
    pub results: Vec<T>,
}

#[derive(FromForm, Clone, Debug)]
pub struct PaginationRequest {
    pub page: u64,
    pub size: u64,
}

pub trait Document: Serialize + DeserializeOwned + Reflect + Typed + Clone {
    fn id(&self) -> String;
    fn create(data: mongodb::bson::Document) -> Result<Self, mongodb::bson::de::Error> {
        let mut doc = data.clone();
        let _ = doc.insert("id", Id::default());
        bson::from_document::<Self>(doc.clone())
    }
}

#[derive(Clone, Debug)]
pub struct Docs<T: Document> {
    inner: Collection<T>,
}

impl<T: Document> Docs<T> {
    pub fn new(database: Database) -> Self {
        let name = TypeRegistration::of::<T>()
            .type_info()
            .type_path_table()
            .short_path()
            .from_case(Case::UpperCamel)
            .to_case(Case::Snake);
        Docs {
            inner: database.collection(name.as_str()),
        }
    }

    pub async fn save(&self, document: T) -> Result<Option<Bson>, mongodb::error::Error> {
        Ok(self
            .inner
            .replace_one(doc! {"_id": document.id()}, document)
            .upsert(true)
            .await?
            .upserted_id)
    }

    pub async fn get<S: Into<String>>(&self, id: S) -> Option<T> {
        match self.inner.find_one(doc! {"_id": id.into()}).await {
            Ok(r) => r,
            Err(_) => None,
        }
    }

    pub async fn paginate(
        &self,
        query: bson::Document,
        pagination_opt: Option<PaginationRequest>,
    ) -> InResult<PaginationResult<T>> {
        let total_count = self.count_documents(query.clone()).await?;
        if let Some(pagination) = pagination_opt {
            let cursor = self
                .find(query.clone())
                .skip(pagination.page * pagination.size)
                .limit(i64::try_from(pagination.size).or::<()>(Ok(0)).unwrap())
                .await?;
            Ok(PaginationResult {
                offset: pagination.page * pagination.size,
                total: total_count,
                results: cursor.try_collect().await?,
            })
        } else {
            let cursor = self.find(query.clone()).await?;
            Ok(PaginationResult {
                offset: 0,
                total: total_count,
                results: cursor.try_collect().await?,
            })
        }
    }
}

#[rocket::async_trait]
impl<T: Document, 'r> FromRequest<'r> for Docs<T> {
    type Error = ApiError;

    async fn from_request(req: &'r Request<'_>) -> Outcome<Self, Self::Error> {
        if let Some(db) = req.rocket().state::<Database>() {
            Outcome::Success(Docs::<T>::new(db.clone()))
        } else {
            Outcome::Error((
                Status::InternalServerError,
                ApiError::Internal(String::from("Client not in state.")),
            ))
        }
    }
}

impl<T: Document> Deref for Docs<T> {
    type Target = Collection<T>;

    fn deref(&self) -> &Self::Target {
        &self.inner
    }
}

impl<T: Document> DerefMut for Docs<T> {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.inner
    }
}

#[derive(Clone, Debug, Serialize, Deserialize, Reflect, PartialEq, Eq, Hash)]
pub struct Id(String);

impl From<String> for Id {
    fn from(value: String) -> Self {
        Id(value)
    }
}

impl Default for Id {
    fn default() -> Self {
        Id(Uuid::new_v4().to_string())
    }
}

impl Deref for Id {
    type Target = String;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl Into<Bson> for Id {
    fn into(self) -> Bson {
        Bson::String(self.0)
    }
}

impl ToString for Id {
    fn to_string(&self) -> String {
        self.0.clone()
    }
}

#[derive(Clone, Debug)]
pub struct Fs(GridFsBucket);

#[rocket::async_trait]
impl<'r> FromRequest<'r> for Fs {
    type Error = ApiError;
    async fn from_request(req: &'r Request<'_>) -> Outcome<Self, Self::Error> {
        if let Some(db) = req.rocket().state::<Database>() {
            Outcome::Success(Self::from_db(db))
        } else {
            Outcome::Error((
                Status::InternalServerError,
                ApiError::Internal(String::from("Client not in state.")),
            ))
        }
    }
}

impl Fs {
    pub fn from_db(db: &Database) -> Self {
        Fs(db.gridfs_bucket(Some(
            GridFsBucketOptions::builder()
                .bucket_name(Some("fs".to_string()))
                .build(),
        )))
    }

    pub async fn upload<T: AsyncReadExt + Unpin>(
        &self,
        data: &mut T,
        content_type: String,
        filename: Option<String>,
    ) -> InResult<File> {
        let id = Id::default();
        let mut uploader = self
            .0
            .open_upload_stream(id.to_string().as_str())
            .id(id.clone().into())
            .metadata(doc! {
                "original_filename": filename.clone(),
                "content_type": content_type.clone()
            })
            .await?;
        let mut content = Vec::<u8>::new();
        data.read_to_end(&mut content).await?;
        uploader.write_all(&content).await?;
        uploader.close().await?;

        Ok(File {
            id,
            filename,
            content_type,
            fs: self.clone(),
        })
    }

    pub async fn get_uploader(
        &self,
        content_type: String,
        filename: Option<String>,
    ) -> InResult<(File, GridFsUploadStream)> {
        let id = Id::default();
        let uploader = self
            .0
            .open_upload_stream(id.to_string().as_str())
            .id(id.clone().into())
            .metadata(doc! {
                "original_filename": filename.clone(),
                "content_type": content_type.clone()
            })
            .await?;

        Ok((
            File {
                id,
                filename,
                content_type,
                fs: self.clone(),
            },
            uploader,
        ))
    }

    pub async fn download(&self, id: Id) -> InResult<Vec<u8>> {
        let mut stream = self.0.open_download_stream(id.into()).await?;
        let mut buffer: Vec<u8> = Vec::new();
        stream.read_to_end(&mut buffer).await?;
        Ok(buffer)
    }

    pub async fn get_downloader(&self, id: Id) -> InResult<GridFsDownloadStream> {
        Ok(self.0.open_download_stream(id.into()).await?)
    }

    pub async fn get_file(&self, id: Id) -> Option<File> {
        if let Ok(Some(document)) = self.0.find_one(doc! {"_id": id.to_string()}).await {
            if let Some(metadata) = document.metadata {
                if let Ok(info) = bson::from_document::<FileInfo>(metadata) {
                    Some(File::from_info(info, &self))
                } else {
                    None
                }
            } else {
                None
            }
        } else {
            None
        }
    }

    pub async fn delete(&self, id: Id) -> InResult<()> {
        Ok(self.0.delete(id.into()).await?)
    }
}

#[derive(Clone, Debug)]
pub struct File {
    pub id: Id,
    pub filename: Option<String>,
    pub content_type: String,
    pub fs: Fs,
}

#[rocket::async_trait]
impl<'r> FromFormField<'r> for File {
    async fn from_data(field: DataField<'r, '_>) -> form::Result<'r, Self> {
        match field.request.guard::<Fs>().await {
            Outcome::Success(fs) => {
                let mut stream = field.data.open(
                    field
                        .request
                        .limits()
                        .get(field.request.route().unwrap().uri.to_string())
                        .unwrap_or(1.gibibytes()),
                );
                if let Ok(result) = fs
                    .upload(
                        &mut stream,
                        field.content_type.to_string(),
                        field
                            .file_name
                            .and_then(|f| f.as_str().and_then(|s| Some(s.to_string()))),
                    )
                    .await
                {
                    Ok(result)
                } else {
                    Err(form::Error::custom(ApiError::Internal(String::from(
                        "Failed to upload file",
                    )))
                    .into())
                }
            }
            _ => Err(form::Error::custom(ApiError::Internal(String::from(
                "Unable to retrieve FS object",
            )))
            .into()),
        }
    }
}

impl File {
    pub fn from_info(info: FileInfo, fs: &Fs) -> Self {
        File {
            id: info.id,
            filename: info.filename,
            content_type: info.content_type,
            fs: fs.clone(),
        }
    }

    pub async fn read(&self) -> InResult<Vec<u8>> {
        self.fs.download(self.id.clone()).await
    }

    pub async fn read_to_temp(&self) -> InResult<NamedTempFile> {
        let mut file = NamedTempFile::new()?;
        file.write_all(self.read().await?.as_slice())?;
        Ok(file)
    }
}

#[derive(Clone, Debug, Serialize, Deserialize, Reflect)]
pub struct FileInfo {
    pub id: Id,
    pub filename: Option<String>,
    pub content_type: String,
}

impl From<File> for FileInfo {
    fn from(value: File) -> Self {
        FileInfo {
            id: value.id,
            filename: value.filename,
            content_type: value.content_type,
        }
    }
}