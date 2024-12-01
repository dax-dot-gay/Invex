use bson::doc;
use rocket::{form::Form, futures::TryStreamExt, serde::json::Json, Route};
use serde::Deserialize;

use crate::{models::{auth::{AuthUser, UserType}, error::ApiError, plugin::RegisteredPlugin}, util::{database::{Docs, File, Fs}, ApiResult}};

#[post("/add/file", data = "<plugin>")]
async fn add_plugin_file(plugin: Form<File>, user: AuthUser, plugins: Docs<RegisteredPlugin>) -> ApiResult<RegisteredPlugin> {
    if user.kind != UserType::Admin {
        return Err(ApiError::Forbidden(
            "Must be an admin to upload plugins".to_string(),
        ));
    }
    if let Ok(registered) = RegisteredPlugin::from_file(plugin.into_inner()).await {
        plugins.save(registered.clone()).await.or(Err(ApiError::Internal("Failed to save plugin info".to_string())))?;
        Ok(Json(registered))
    } else {
        Err(ApiError::Internal("Failed to upload plugin".to_string()))
    }
}

#[derive(Deserialize)]
struct PluginURL {
    pub url: String
}

#[post("/add/url", data = "<plugin>")]
async fn add_plugin_url(plugin: Json<PluginURL>, user: AuthUser, plugins: Docs<RegisteredPlugin>, fs: Fs) -> ApiResult<RegisteredPlugin> {
    if user.kind != UserType::Admin {
        return Err(ApiError::Forbidden(
            "Must be an admin to upload plugins".to_string(),
        ));
    }
    if let Ok(registered) = RegisteredPlugin::from_url(plugin.url.clone(), fs).await {
        plugins.save(registered.clone()).await.or(Err(ApiError::Internal("Failed to save plugin info".to_string())))?;
        Ok(Json(registered))
    } else {
        Err(ApiError::Internal("Failed to upload plugin".to_string()))
    }
}

#[get("/")]
async fn list_plugins(user: AuthUser, plugins: Docs<RegisteredPlugin>) -> ApiResult<Vec<RegisteredPlugin>> {
    if user.kind != UserType::Admin {
        return Err(ApiError::Forbidden(
            "Must be an admin to list plugins".to_string(),
        ));
    }

    if let Ok(cursor) = plugins.find(doc! {}).await {
        if let Ok(results) = cursor.try_collect::<Vec<RegisteredPlugin>>().await {
            Ok(Json(results))
        } else {
            Err(ApiError::Internal("Database query failed".to_string()))
        }
    } else {
        Err(ApiError::Internal("Database query failed".to_string()))
    }
}

pub fn routes() -> Vec<Route> {
    return routes![add_plugin_file, add_plugin_url, list_plugins];
}