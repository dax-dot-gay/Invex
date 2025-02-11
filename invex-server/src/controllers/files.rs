use bson::doc;
use invex_sdk::GrantResource;
use mongodb::gridfs::GridFsDownloadStream;
use rocket::{form::Form, http::ContentType, response::stream::{One, ReaderStream}, serde::json::Json, Route};
use tokio_util::compat::{Compat, FuturesAsyncReadCompatExt};

use crate::{models::{auth::{AuthUser, UserType}, client::{ClientResource, ClientResourceGrant, ClientResourcePluginGrant}, error::ApiError, invite::InviteUsage, plugin::PluginRegistry}, util::{database::{Collections, Docs, Document, File, FileInfo, Fs}, ApiResult}};

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
async fn get_file(user: AuthUser, id: &str, fs: Fs, usages: Docs<InviteUsage>, plugins: PluginRegistry, collections: Collections) -> Result<(ContentType, ReaderStream<One<Compat<GridFsDownloadStream>>>), ApiError> {
    if user.kind != UserType::Admin {
        let mut found = false;
        for invite_usage in usages.query_many(doc! {"user": user.id()}).await.or(Err(ApiError::internal("Failed to retrieve invite usages")))? {
            if let Ok(parsed) = ClientResource::parse(invite_usage.clone(), &collections, &plugins).await {
                for resource in parsed {
                    found = match resource.grant {
                        ClientResourceGrant::Attachment { file_id, .. } => file_id == id,
                        ClientResourceGrant::InlineImage { file_id, .. } => file_id == id,
                        ClientResourceGrant::Plugin { result, .. } => match result {
                            ClientResourcePluginGrant::Success { resources, .. } => resources.iter().any(|r| {
                                if let GrantResource::File { file_id, .. } = r {
                                    file_id == id
                                } else {
                                    false
                                }
                            }),
                            _ => false
                        },
                        _ => false
                    };

                    if found {
                        break;
                    }
                }
            }

            if found {
                break;
            }
        }

        if !found {
            return Err(ApiError::Forbidden(
                "Must be an admin to get arbitrary files".to_string(),
            ));
        }
    }

    if let Some(file) = fs.get_file(id.to_string().into()).await {
        let downloader = fs.get_downloader(id.to_string().into()).await.unwrap();
        let stream = ReaderStream::one(downloader.compat());
        Ok((ContentType::parse_flexible(&file.content_type).unwrap_or(ContentType::new("application", "octet-stream")), stream))
    } else {
        Err(ApiError::NotFound("File not found or inaccessible".to_string()))
    }
}

#[get("/<id>/meta")]
async fn get_file_metadata(user: AuthUser, id: &str, fs: Fs, usages: Docs<InviteUsage>, plugins: PluginRegistry, collections: Collections) -> ApiResult<FileInfo> {
    if user.kind != UserType::Admin {
        let mut found = false;
        for invite_usage in usages.query_many(doc! {"user": user.id()}).await.or(Err(ApiError::internal("Failed to retrieve invite usages")))? {
            if let Ok(parsed) = ClientResource::parse(invite_usage.clone(), &collections, &plugins).await {
                for resource in parsed {
                    found = match resource.grant {
                        ClientResourceGrant::Attachment { file_id, .. } => file_id == id,
                        ClientResourceGrant::InlineImage { file_id, .. } => file_id == id,
                        ClientResourceGrant::Plugin { result, .. } => match result {
                            ClientResourcePluginGrant::Success { resources, .. } => resources.iter().any(|r| {
                                if let GrantResource::File { file_id, .. } = r {
                                    file_id == id
                                } else {
                                    false
                                }
                            }),
                            _ => false
                        },
                        _ => false
                    };

                    if found {
                        break;
                    }
                }
            }

            if found {
                break;
            }
        }

        if !found {
            return Err(ApiError::Forbidden(
                "Must be an admin to get arbitrary files".to_string(),
            ));
        }
    }
    if let Some(file) = fs.get_file(id.to_string().into()).await {
        Ok(Json(file.into()))
    } else {
        Err(ApiError::NotFound("File not found or inaccessible".to_string()))
    }
}

#[delete("/<id>")]
async fn delete_file(user: AuthUser, id: &str, fs: Fs) -> Result<(), ApiError> {
    if user.kind != UserType::Admin {
        return Err(ApiError::Forbidden(
            "Must be an admin to delete files".to_string(),
        ));
    }
    if let Some(_) = fs.get_file(id.to_string().into()).await {
        fs.delete(id.to_string().into()).await.or(Err(ApiError::Internal("Failed to delete file".to_string())))
    } else {
        Err(ApiError::NotFound("File not found or inaccessible".to_string()))
    }
}

pub fn routes() -> Vec<Route> {
    routes![upload_file, get_file, delete_file, get_file_metadata]
}