use bson::doc;
use extism::Wasm;
use invex_sdk::PluginMetadata;
use rocket::{
    form::Form, fs::TempFile, futures::TryStreamExt, serde::json::Json, tokio::io::AsyncReadExt,
    Route,
};
use serde::Deserialize;

use crate::{
    models::{
        auth::{AuthUser, UserType},
        error::ApiError,
        plugin::RegisteredPlugin,
    },
    util::{
        database::{Docs, File, Fs},
        plugins::PluginInfo,
        ApiResult,
    },
};

#[post("/add/file", data = "<plugin>")]
async fn add_plugin_file(
    plugin: Form<File>,
    user: AuthUser,
    plugins: Docs<RegisteredPlugin>,
) -> ApiResult<RegisteredPlugin> {
    if user.kind != UserType::Admin {
        return Err(ApiError::Forbidden(
            "Must be an admin to upload plugins".to_string(),
        ));
    }
    if let Ok(registered) = RegisteredPlugin::from_file(plugin.into_inner()).await {
        plugins
            .save(registered.clone())
            .await
            .or(Err(ApiError::Internal(
                "Failed to save plugin info".to_string(),
            )))?;
        Ok(Json(registered))
    } else {
        Err(ApiError::Internal("Failed to upload plugin".to_string()))
    }
}

#[post("/preview/file", data = "<plugin>")]
async fn preview_plugin_file(
    plugin: Form<TempFile<'_>>,
    user: AuthUser,
) -> ApiResult<PluginMetadata> {
    if user.kind != UserType::Admin {
        return Err(ApiError::Forbidden(
            "Must be an admin to upload plugins".to_string(),
        ));
    }
    if plugin.content_type().is_some_and(|c| c.is_wasm()) {
        if let Ok(mut data) = plugin.open().await {
            let mut buf: Vec<u8> = Vec::new();
            data.read_to_end(&mut buf)
                .await
                .or(Err(ApiError::BadRequest(
                    "File was unreadable.".to_string(),
                )))?;
            if let Ok(result) = PluginInfo::from_wasm(Wasm::data(buf)).await {
                return Ok(Json(result.metadata));
            } else {
                return Err(ApiError::BadRequest("Plugin data was invalid.".to_string()));
            }
        } else {
            return Err(ApiError::BadRequest("File was unreadable.".to_string()));
        }
    } else {
        return Err(ApiError::BadRequest("Expected a WASM file.".to_string()));
    }
}

#[derive(Deserialize)]
struct PluginURL {
    pub url: String,
}

#[post("/add/url", data = "<plugin>")]
async fn add_plugin_url(
    plugin: Json<PluginURL>,
    user: AuthUser,
    plugins: Docs<RegisteredPlugin>,
    fs: Fs,
) -> ApiResult<RegisteredPlugin> {
    if user.kind != UserType::Admin {
        return Err(ApiError::Forbidden(
            "Must be an admin to upload plugins".to_string(),
        ));
    }
    if let Ok(registered) = RegisteredPlugin::from_url(plugin.url.clone(), fs).await {
        plugins
            .save(registered.clone())
            .await
            .or(Err(ApiError::Internal(
                "Failed to save plugin info".to_string(),
            )))?;
        Ok(Json(registered))
    } else {
        Err(ApiError::Internal("Failed to upload plugin".to_string()))
    }
}

#[post("/preview/url", data = "<plugin>")]
async fn preview_plugin_url(plugin: Json<PluginURL>, user: AuthUser) -> ApiResult<PluginMetadata> {
    if user.kind != UserType::Admin {
        return Err(ApiError::Forbidden(
            "Must be an admin to upload plugins".to_string(),
        ));
    }
    if let Ok(result) = PluginInfo::from_wasm(Wasm::url(plugin.url.clone())).await {
        return Ok(Json(result.metadata));
    } else {
        return Err(ApiError::BadRequest("Invalid plugin.".to_string()));
    }
}

#[get("/")]
async fn list_plugins(
    user: AuthUser,
    plugins: Docs<RegisteredPlugin>,
) -> ApiResult<Vec<RegisteredPlugin>> {
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

#[delete("/<id>")]
async fn delete_plugin(
    user: AuthUser,
    id: &str,
    plugins: Docs<RegisteredPlugin>,
    fs: Fs,
) -> ApiResult<()> {
    if user.kind != UserType::Admin {
        return Err(ApiError::Forbidden(
            "Must be an admin to delete plugins".to_string(),
        ));
    }

    if let Some(plugin) = plugins.get(id).await {
        if let Ok(_) = fs.delete(plugin.source.id).await {
            if let Ok(_) = plugins.delete_one(doc! {"_id": id.to_string()}).await {
                Ok(Json(()))
            } else {
                Err(ApiError::Internal(
                    "Failed to delete registered plugin".to_string(),
                ))
            }
        } else {
            Err(ApiError::Internal(
                "Failed to delete plugin files".to_string(),
            ))
        }
    } else {
        Err(ApiError::NotFound("Unknown plugin ID".to_string()))
    }
}

#[post("/<id>/enable")]
async fn enable_plugin(
    user: AuthUser,
    id: &str,
    plugins: Docs<RegisteredPlugin>,
) -> ApiResult<()> {
    if user.kind != UserType::Admin {
        return Err(ApiError::Forbidden(
            "Must be an admin to delete plugins".to_string(),
        ));
    }

    if let Some(mut plugin) = plugins.get(id).await {
        plugin.enabled = true;
        if let Ok(_) = plugins.save(plugin).await {
            Ok(Json(()))
        } else {
            Err(ApiError::Internal(
                "Failed to update registered plugin".to_string(),
            ))
        }
    } else {
        Err(ApiError::NotFound("Unknown plugin ID".to_string()))
    }
}

#[post("/<id>/disable")]
async fn disable_plugin(
    user: AuthUser,
    id: &str,
    plugins: Docs<RegisteredPlugin>,
) -> ApiResult<()> {
    if user.kind != UserType::Admin {
        return Err(ApiError::Forbidden(
            "Must be an admin to delete plugins".to_string(),
        ));
    }

    if let Some(mut plugin) = plugins.get(id).await {
        plugin.enabled = false;
        if let Ok(_) = plugins.save(plugin).await {
            Ok(Json(()))
        } else {
            Err(ApiError::Internal(
                "Failed to update registered plugin".to_string(),
            ))
        }
    } else {
        Err(ApiError::NotFound("Unknown plugin ID".to_string()))
    }
}

#[get("/<id>")]
async fn get_plugin(user: AuthUser, id: &str, plugins: Docs<RegisteredPlugin>) -> ApiResult<RegisteredPlugin> {
    if user.kind != UserType::Admin {
        return Err(ApiError::Forbidden(
            "Must be an admin to get full plugin information".to_string(),
        ));
    }

    if let Some(plugin) = plugins.get(id).await {
        Ok(Json(plugin))
    } else {
        Err(ApiError::NotFound("Unknown plugin ID".to_string()))
    }
}

pub fn routes() -> Vec<Route> {
    return routes![
        add_plugin_file,
        add_plugin_url,
        list_plugins,
        preview_plugin_file,
        preview_plugin_url,
        delete_plugin,
        enable_plugin,
        disable_plugin,
        get_plugin
    ];
}
