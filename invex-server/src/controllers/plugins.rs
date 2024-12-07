use bson::doc;
use invex_sdk::PluginMetadata;
use rocket::{
    form::Form, fs::TempFile, serde::json::Json,
    Route,
};
use serde::Deserialize;

use crate::{
    models::{
        auth::{AuthUser, UserType},
        error::ApiError,
        plugin::{PluginInfo, PluginRegistry},
    },
    util::{
        database::File,
        ApiResult,
    },
};

#[post("/add/file", data = "<plugin>")]
async fn add_plugin_file(
    plugin: Form<File>,
    user: AuthUser,
    plugins: PluginRegistry
) -> ApiResult<PluginInfo> {
    if user.kind != UserType::Admin {
        return Err(ApiError::Forbidden(
            "Must be an admin to upload plugins".to_string(),
        ));
    }
    if let Ok(registered) = plugins.register_file(plugin.into_inner()).await {
        Ok(Json(registered.into()))
    } else {
        Err(ApiError::Internal("Failed to upload plugin".to_string()))
    }
}

#[post("/preview/file", data = "<plugin>")]
async fn preview_plugin_file(
    plugin: Form<TempFile<'_>>,
    user: AuthUser,
    plugins: PluginRegistry
) -> ApiResult<PluginMetadata> {
    if user.kind != UserType::Admin {
        return Err(ApiError::Forbidden(
            "Must be an admin to upload plugins".to_string(),
        ));
    }
    if plugin.content_type().is_some_and(|c| c.is_wasm()) {
        if let Ok(mut data) = plugin.open().await {
            let res = plugins.preview_file(&mut data).await;
            if let Ok(result) = res {
                return Ok(Json(result.metadata));
            } else {
                println!("{res:?}");
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
    plugins: PluginRegistry
) -> ApiResult<PluginInfo> {
    if user.kind != UserType::Admin {
        return Err(ApiError::Forbidden(
            "Must be an admin to upload plugins".to_string(),
        ));
    }
    if let Ok(registered) = plugins.register_url(plugin.url.clone()).await {
        Ok(Json(registered.into()))
    } else {
        Err(ApiError::Internal("Failed to upload plugin".to_string()))
    }
}

#[post("/preview/url", data = "<plugin>")]
async fn preview_plugin_url(plugin: Json<PluginURL>, user: AuthUser, plugins: PluginRegistry) -> ApiResult<PluginMetadata> {
    if user.kind != UserType::Admin {
        return Err(ApiError::Forbidden(
            "Must be an admin to upload plugins".to_string(),
        ));
    }
    if let Ok(result) = plugins.preview_url(plugin.url.clone()).await {
        return Ok(Json(result.metadata));
    } else {
        return Err(ApiError::BadRequest("Invalid plugin.".to_string()));
    }
}

#[get("/")]
async fn list_plugins(
    user: AuthUser,
    plugins: PluginRegistry
) -> ApiResult<Vec<PluginInfo>> {
    if user.kind != UserType::Admin {
        return Err(ApiError::Forbidden(
            "Must be an admin to list plugins".to_string(),
        ));
    }

    if let Ok(results) = plugins.list().await {
        Ok(Json(results))
    } else {
        Err(ApiError::Internal("Database query failed".to_string()))
    }
}

#[delete("/<id>")]
async fn delete_plugin(
    user: AuthUser,
    id: &str,
    plugins: PluginRegistry
) -> ApiResult<()> {
    if user.kind != UserType::Admin {
        return Err(ApiError::Forbidden(
            "Must be an admin to delete plugins".to_string(),
        ));
    }

    if plugins.exists(id).await {
        plugins.deregister(id).await;
        Ok(Json(()))
    } else {
        Err(ApiError::NotFound("Unknown plugin ID".to_string()))
    }
}

#[post("/<id>/enable")]
async fn enable_plugin(
    user: AuthUser,
    id: &str,
    plugins: PluginRegistry,
) -> ApiResult<()> {
    if user.kind != UserType::Admin {
        return Err(ApiError::Forbidden(
            "Must be an admin to delete plugins".to_string(),
        ));
    }

    if let Some(mut plugin) = plugins.get(id).await {
        plugin.set_enabled(true);
        if let Ok(_) = plugin.save().await {
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
    plugins: PluginRegistry
) -> ApiResult<()> {
    if user.kind != UserType::Admin {
        return Err(ApiError::Forbidden(
            "Must be an admin to delete plugins".to_string(),
        ));
    }

    if let Some(mut plugin) = plugins.get(id).await {
        plugin.set_enabled(false);
        if let Ok(_) = plugin.save().await {
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
async fn get_plugin(user: AuthUser, id: &str, plugins: PluginRegistry) -> ApiResult<PluginInfo> {
    if user.kind != UserType::Admin {
        return Err(ApiError::Forbidden(
            "Must be an admin to get full plugin information".to_string(),
        ));
    }

    if let Some(plugin) = plugins.get(id).await {
        Ok(Json(plugin.into()))
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
