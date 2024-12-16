use std::collections::HashMap;

use bson::doc;
use invex_sdk::{
    call::{ MethodCall, MethodReply, MethodResult },
    params::PluginFieldParams,
    ArgValidator,
    FieldType,
    PluginDefinedMethodContext,
    PluginMetadata,
    ValidationResult,
};
use rocket::{ form::Form, fs::TempFile, futures::TryStreamExt, serde::json::Json, Route };
use serde::{ Deserialize, Serialize };
use serde_json::Value;

use crate::{
    models::{
        auth::{ AuthUser, UserType },
        error::ApiError,
        plugin::{ PluginConfiguration, PluginInfo, PluginRegistry },
        service::Service,
    },
    util::{ database::{ Docs, File, Id }, ApiResult },
};

#[post("/add/file", data = "<plugin>")]
async fn add_plugin_file(
    plugin: Form<File>,
    user: AuthUser,
    plugins: PluginRegistry
) -> ApiResult<PluginInfo> {
    if user.kind != UserType::Admin {
        return Err(ApiError::Forbidden("Must be an admin to upload plugins".to_string()));
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
        return Err(ApiError::Forbidden("Must be an admin to upload plugins".to_string()));
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
        return Err(ApiError::Forbidden("Must be an admin to upload plugins".to_string()));
    }
    if let Ok(registered) = plugins.register_url(plugin.url.clone()).await {
        Ok(Json(registered.into()))
    } else {
        Err(ApiError::Internal("Failed to upload plugin".to_string()))
    }
}

#[post("/preview/url", data = "<plugin>")]
async fn preview_plugin_url(
    plugin: Json<PluginURL>,
    user: AuthUser,
    plugins: PluginRegistry
) -> ApiResult<PluginMetadata> {
    if user.kind != UserType::Admin {
        return Err(ApiError::Forbidden("Must be an admin to upload plugins".to_string()));
    }
    if let Ok(result) = plugins.preview_url(plugin.url.clone()).await {
        return Ok(Json(result.metadata));
    } else {
        return Err(ApiError::BadRequest("Invalid plugin.".to_string()));
    }
}

#[get("/")]
async fn list_plugins(user: AuthUser, plugins: PluginRegistry) -> ApiResult<Vec<PluginInfo>> {
    if user.kind != UserType::Admin {
        return Err(ApiError::Forbidden("Must be an admin to list plugins".to_string()));
    }

    if let Ok(results) = plugins.list().await {
        Ok(Json(results))
    } else {
        Err(ApiError::Internal("Database query failed".to_string()))
    }
}

#[delete("/<id>")]
async fn delete_plugin(user: AuthUser, id: &str, plugins: PluginRegistry) -> ApiResult<()> {
    if user.kind != UserType::Admin {
        return Err(ApiError::Forbidden("Must be an admin to delete plugins".to_string()));
    }

    if plugins.exists(id).await {
        plugins.deregister(id).await;
        Ok(Json(()))
    } else {
        Err(ApiError::NotFound("Unknown plugin ID".to_string()))
    }
}

#[post("/<id>/enable")]
async fn enable_plugin(user: AuthUser, id: &str, plugins: PluginRegistry) -> ApiResult<()> {
    if user.kind != UserType::Admin {
        return Err(ApiError::Forbidden("Must be an admin to delete plugins".to_string()));
    }

    if let Some(mut plugin) = plugins.get(id).await {
        plugin.set_enabled(true);
        if let Ok(_) = plugin.save().await {
            Ok(Json(()))
        } else {
            Err(ApiError::Internal("Failed to update registered plugin".to_string()))
        }
    } else {
        Err(ApiError::NotFound("Unknown plugin ID".to_string()))
    }
}

#[post("/<id>/disable")]
async fn disable_plugin(user: AuthUser, id: &str, plugins: PluginRegistry) -> ApiResult<()> {
    if user.kind != UserType::Admin {
        return Err(ApiError::Forbidden("Must be an admin to delete plugins".to_string()));
    }

    if let Some(mut plugin) = plugins.get(id).await {
        plugin.set_enabled(false);
        if let Ok(_) = plugin.save().await {
            Ok(Json(()))
        } else {
            Err(ApiError::Internal("Failed to update registered plugin".to_string()))
        }
    } else {
        Err(ApiError::NotFound("Unknown plugin ID".to_string()))
    }
}

#[get("/<id>")]
async fn get_plugin(user: AuthUser, id: &str, plugins: PluginRegistry) -> ApiResult<PluginInfo> {
    if user.kind != UserType::Admin {
        return Err(
            ApiError::Forbidden("Must be an admin to get full plugin information".to_string())
        );
    }

    if let Some(plugin) = plugins.get(id).await {
        Ok(Json(plugin.into()))
    } else {
        Err(ApiError::NotFound("Unknown plugin ID".to_string()))
    }
}

#[derive(Deserialize, Serialize, Clone, Debug)]
struct PluginConfigModel {
    #[serde(default)]
    pub icon: Option<String>,
    pub name: String,
    pub options: HashMap<String, Value>,
}

#[post("/<id>/configs", data = "<conf>")]
async fn create_plugin_config(
    user: AuthUser,
    id: &str,
    plugins: PluginRegistry,
    configs: Docs<PluginConfiguration>,
    conf: Json<PluginConfigModel>
) -> ApiResult<PluginConfiguration> {
    if user.kind != UserType::Admin {
        return Err(
            ApiError::Forbidden("Must be an admin to create plugin config profiles".to_string())
        );
    }

    if plugins.exists(id).await {
        if configs.exists(doc! { "name": conf.name.clone(), "plugin": id }).await {
            return Err(
                ApiError::MethodNotAllowed(
                    "A configuration profile with this name already exists.".to_string()
                )
            );
        }

        let config = PluginConfiguration {
            id: Id::default(),
            plugin: id.to_string(),
            icon: conf.icon.clone(),
            name: conf.name.clone(),
            options: conf.options.clone(),
        };

        if let Ok(_) = configs.save(config.clone()).await {
            Ok(Json(config))
        } else {
            Err(ApiError::Internal("Failed to save config to database".to_string()))
        }
    } else {
        Err(ApiError::NotFound("Unknown plugin ID".to_string()))
    }
}

#[get("/<id>/configs")]
async fn get_plugin_configs(
    user: AuthUser,
    id: &str,
    plugins: PluginRegistry,
    configs: Docs<PluginConfiguration>
) -> ApiResult<Vec<PluginConfiguration>> {
    if user.kind != UserType::Admin {
        return Err(ApiError::Forbidden("Must be an admin to get plugin configs".to_string()));
    }

    if plugins.exists(id).await {
        if let Ok(cursor) = configs.find(doc! { "plugin": id }).await {
            if let Ok(results) = cursor.try_collect::<Vec<PluginConfiguration>>().await {
                Ok(Json(results))
            } else {
                Err(ApiError::Internal("Failed to list configs".to_string()))
            }
        } else {
            Err(ApiError::Internal("Failed to list configs".to_string()))
        }
    } else {
        Err(ApiError::NotFound("Unknown plugin ID".to_string()))
    }
}

#[get("/<id>/configs/<config_id>", rank = 2)]
async fn get_plugin_config_by_id(
    user: AuthUser,
    id: &str,
    plugins: PluginRegistry,
    configs: Docs<PluginConfiguration>,
    config_id: &str
) -> ApiResult<PluginConfiguration> {
    if user.kind != UserType::Admin {
        return Err(ApiError::Forbidden("Must be an admin to get plugin configs".to_string()));
    }

    if plugins.exists(id).await {
        if let Some(result) = configs.get(config_id).await {
            if result.plugin == id.to_string() {
                Ok(Json(result))
            } else {
                Err(ApiError::NotFound("Unknown plugin config ID".to_string()))
            }
        } else {
            Err(ApiError::NotFound("Unknown plugin config ID".to_string()))
        }
    } else {
        Err(ApiError::NotFound("Unknown plugin ID".to_string()))
    }
}

#[post("/<id>/configs/<config_id>", data = "<update>")]
async fn update_plugin_config(
    user: AuthUser,
    id: &str,
    plugins: PluginRegistry,
    configs: Docs<PluginConfiguration>,
    config_id: &str,
    update: Json<PluginConfigModel>
) -> ApiResult<PluginConfiguration> {
    if user.kind != UserType::Admin {
        return Err(ApiError::Forbidden("Must be an admin to modify plugin configs".to_string()));
    }

    if plugins.exists(id).await {
        if
            configs.exists(
                doc! { "name": update.name.clone(), "plugin": id, "_id": {"$ne": config_id} }
            ).await
        {
            return Err(
                ApiError::MethodNotAllowed(
                    "A configuration profile with this name already exists.".to_string()
                )
            );
        }

        if let Some(mut result) = configs.get(config_id).await {
            if result.plugin == id.to_string() {
                result.icon = update.icon.clone();
                result.name = update.name.clone();
                result.options = update.options.clone();
                if let Ok(_) = configs.save(result.clone()).await {
                    Ok(Json(result))
                } else {
                    Err(ApiError::Internal("Failed to save config to database".to_string()))
                }
            } else {
                Err(ApiError::NotFound("Unknown plugin config ID".to_string()))
            }
        } else {
            Err(ApiError::NotFound("Unknown plugin config ID".to_string()))
        }
    } else {
        Err(ApiError::NotFound("Unknown plugin ID".to_string()))
    }
}

#[delete("/<id>/configs/<config_id>")]
async fn delete_plugin_config(
    user: AuthUser,
    id: &str,
    plugins: PluginRegistry,
    configs: Docs<PluginConfiguration>,
    config_id: &str
) -> ApiResult<()> {
    if user.kind != UserType::Admin {
        return Err(ApiError::Forbidden("Must be an admin to modify plugin configs".to_string()));
    }

    if plugins.exists(id).await {
        if let Some(result) = configs.get(config_id).await {
            if result.plugin == id.to_string() {
                if let Ok(_) = configs.delete_one(doc! { "_id": config_id }).await {
                    Ok(Json(()))
                } else {
                    Err(ApiError::Internal("Failed to save config to database".to_string()))
                }
            } else {
                Err(ApiError::NotFound("Unknown plugin config ID".to_string()))
            }
        } else {
            Err(ApiError::NotFound("Unknown plugin config ID".to_string()))
        }
    } else {
        Err(ApiError::NotFound("Unknown plugin ID".to_string()))
    }
}

#[get("/<id>/configs/validated")]
async fn get_validated_configs(
    user: AuthUser,
    id: &str,
    plugins: PluginRegistry,
    configs: Docs<PluginConfiguration>
) -> ApiResult<HashMap<String, (PluginConfiguration, ValidationResult)>> {
    if user.kind != UserType::Admin {
        return Err(ApiError::Forbidden("Must be an admin to validate plugin configs".to_string()));
    }

    if let Some(plugin) = plugins.get(id).await {
        if let Ok(cursor) = configs.find(doc! { "plugin": id }).await {
            if let Ok(plugin_configs) = cursor.try_collect::<Vec<PluginConfiguration>>().await {
                let mut result: HashMap<
                    String,
                    (PluginConfiguration, ValidationResult)
                > = HashMap::new();
                for conf in plugin_configs {
                    result.insert(conf.id.to_string(), (
                        conf.clone(),
                        plugin.metadata().config.validate(conf.options),
                    ));
                }

                Ok(Json(result))
            } else {
                Err(ApiError::Internal("Failed to list configs".to_string()))
            }
        } else {
            Err(ApiError::Internal("Failed to list configs".to_string()))
        }
    } else {
        Err(ApiError::NotFound("Unknown plugin ID".to_string()))
    }
}

#[allow(unused_variables)]
#[post("/<id>/call", data = "<parameters>")]
async fn call_plugin_method(
    id: &str,
    user: AuthUser,
    plugins: PluginRegistry,
    parameters: Json<MethodCall>,
    configs: Docs<PluginConfiguration>,
    services: Docs<Service>
) -> ApiResult<MethodResult> {
    if let Some(plugin) = plugins.get(id).await {
        match parameters.into_inner() {
            MethodCall::PluginDefinedField { field_key } => {
                if let Some(field) = plugin.get_field(field_key) {
                    if let FieldType::PluginDefined { method, context, .. } = field.field {
                        if let PluginDefinedMethodContext::Plugin = context {
                            match
                                plugin.call::<_, FieldType>(
                                    method,
                                    PluginFieldParams::PluginConfig {}
                                ).await
                            {
                                Ok(r) => Ok(Json(MethodReply::FieldDefinition(r).into())),
                                Err(e) => Ok(Json(e.into())),
                            }
                        } else {
                            Err(
                                ApiError::MethodNotAllowed(
                                    "Field is used in the wrong context".to_string()
                                )
                            )
                        }
                    } else {
                        Err(ApiError::MethodNotAllowed("Field is not plugin-defined".to_string()))
                    }
                } else {
                    Err(ApiError::NotFound("Unknown field key".to_string()))
                }
            }
            MethodCall::ServiceDefinedField { field_key, config_id, grant_id } => {
                let config = configs
                    .get(config_id).await
                    .ok_or(
                        Err::<(), ApiError>(ApiError::NotFound("Unknown config ID".to_string()))
                    )?;
                let grant = plugin
                    .get_grant(grant_id)
                    .ok_or(
                        Err::<(), ApiError>(ApiError::NotFound("Unknown grant ID".to_string()))
                    )?;
                let field = grant
                    .get_option(field_key)
                    .ok_or(
                        Err::<(), ApiError>(ApiError::NotFound("Unknown field key".to_string()))
                    )?;
                if let FieldType::PluginDefined { method, context, .. } = field.field {
                    if !matches!(context, PluginDefinedMethodContext::Service) {
                        return Err(
                            ApiError::MethodNotAllowed(
                                "Field is used in the wrong context".to_string()
                            )
                        );
                    }

                    match
                        plugin.call::<_, FieldType>(method, PluginFieldParams::ServiceConfig {
                            plugin_config: config.options.into(),
                        }).await
                    {
                        Ok(r) => Ok(Json(MethodReply::FieldDefinition(r).into())),
                        Err(e) => Ok(Json(e.into())),
                    }
                } else {
                    Err(ApiError::MethodNotAllowed("Field is not plugin-defined".to_string()))
                }
            }
            _ => Err(ApiError::Internal("Selected method is not yet handled.".to_string())),
        }
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
        get_plugin,
        create_plugin_config,
        get_plugin_configs,
        get_plugin_config_by_id,
        update_plugin_config,
        delete_plugin_config,
        get_validated_configs,
        call_plugin_method
    ];
}
