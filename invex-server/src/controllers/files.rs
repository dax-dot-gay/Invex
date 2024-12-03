use mongodb::gridfs::GridFsDownloadStream;
use rocket::{form::Form, http::ContentType, response::stream::{One, ReaderStream}, serde::json::Json, Route};
use tokio_util::compat::{Compat, FuturesAsyncReadCompatExt};

use crate::{models::{auth::{AuthUser, UserType}, error::ApiError}, util::{database::{File, FileInfo, Fs}, ApiResult}};

#[post("/", data = "<file>")]
async fn upload_file(user: AuthUser, file: Form<File>) -> ApiResult<FileInfo> {
    if user.kind != UserType::Admin {
        return Err(ApiError::Forbidden(
            "Must be an admin to upload files".to_string(),
        ));
    }
    Ok(Json(file.into_inner().into()))
}

#[get("/<id>")]
async fn get_file(user: AuthUser, id: &str, fs: Fs) -> Result<(ContentType, ReaderStream<One<Compat<GridFsDownloadStream>>>), ApiError> {
    if user.kind != UserType::Admin {
        return Err(ApiError::Forbidden(
            "Must be an admin to get arbitrary files".to_string(),
        ));
    }
    if let Some(file) = fs.get_file(id.to_string().into()).await {
        let downloader = fs.get_downloader(id.to_string().into()).await.unwrap();
        let stream = ReaderStream::one(downloader.compat());
        Ok((ContentType::parse_flexible(&file.content_type).unwrap_or(ContentType::new("application", "octet-stream")), stream))
    } else {
        Err(ApiError::NotFound("File not found or inaccessible".to_string()))
    }
}

pub fn routes() -> Vec<Route> {
    routes![upload_file, get_file]
}