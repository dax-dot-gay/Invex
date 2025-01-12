use bson::doc;
use invex_sdk::{
    params::{ GrantActionParams, ParameterMap },
    ArgValidator,
    GrantResource,
    ValidationResult,
};
use rocket::{ futures::TryStreamExt, serde::json::Json, Route };
use serde::Deserialize;

use crate::{
    models::{
        auth::{ AuthUser, UserType },
        error::ApiError,
        plugin::{ PluginConfiguration, PluginRegistry },
        service::{ Service, ServiceGrant },
    },
    util::{ database::Docs, ApiResult },
};

#[derive(Deserialize)]
struct ServiceCreateModel {
    pub name: String,
    pub icon: Option<String>,
    pub description: Option<String>,
}

#[post("/create", data = "<model>")]
async fn create_service(
    user: AuthUser,
    services: Docs<Service>,
    model: Json<ServiceCreateModel>
) -> ApiResult<Service> {
    if user.kind != UserType::Admin {
        return Err(ApiError::Forbidden("Must be an admin to create services".to_string()));
    }
    let created = Service::create(
        model.name.clone(),
        model.icon.clone(),
        model.description.clone()
    );
    if let Ok(_) = services.save(created.clone()).await {
        Ok(Json(created))
    } else {
        Err(ApiError::Internal("Failed to create new Service".to_string()))
    }
}

#[get("/")]
async fn get_services(user: AuthUser, services: Docs<Service>) -> ApiResult<Vec<Service>> {
    if user.kind != UserType::Admin {
        return Err(ApiError::Forbidden("Must be an admin to list all services".to_string()));
    }
    if let Ok(cursor) = services.find(doc! {}).await {
        match cursor.try_collect::<Vec<Service>>().await {
            Ok(results) => Ok(Json(results)),
            Err(e) => {
                println!("{e:?}");
                Err(ApiError::Internal("Failed to list services - collection".to_string()))
            }
        }
    } else {
        Err(ApiError::Internal("Failed to list services - query".to_string()))
    }
}

#[get("/<id>")]
async fn get_service_by_id(
    user: AuthUser,
    services: Docs<Service>,
    id: &str
) -> ApiResult<Service> {
    if user.kind != UserType::Admin {
        return Err(ApiError::Forbidden("Must be an admin to get services".to_string()));
    }
    if let Some(result) = services.get(id).await {
        Ok(Json(result))
    } else {
        Err(ApiError::NotFound("Unknown service ID".to_string()))
    }
}

#[delete("/<id>")]
async fn delete_service(user: AuthUser, services: Docs<Service>, id: &str) -> ApiResult<()> {
    if user.kind != UserType::Admin {
        return Err(ApiError::Forbidden("Must be an admin to delete services".to_string()));
    }
    if let Ok(_) = services.delete_one(doc! { "_id": id }).await {
        Ok(Json(()))
    } else {
        Err(ApiError::NotFound("Unknown service ID".to_string()))
    }
}

#[post("/<id>/update", data = "<model>")]
async fn update_service(
    user: AuthUser,
    services: Docs<Service>,
    id: &str,
    model: Json<ServiceCreateModel>
) -> ApiResult<Service> {
    if user.kind != UserType::Admin {
        return Err(ApiError::Forbidden("Must be an admin to edit services".to_string()));
    }
    if let Some(mut result) = services.get(id).await {
        result.description = model.description.clone();
        result.icon = model.icon.clone();
        result.name = model.name.clone();
        if let Ok(_) = services.save(result.clone()).await {
            Ok(Json(result))
        } else {
            Err(ApiError::Internal("Failed to update service".to_string()))
        }
    } else {
        Err(ApiError::NotFound("Unknown service ID".to_string()))
    }
}

#[post("/<id>/grants", data = "<grant>")]
async fn create_service_grant(
    user: AuthUser,
    services: Docs<Service>,
    id: &str,
    grant: Json<ServiceGrant>
) -> ApiResult<Service> {
    if user.kind != UserType::Admin {
        return Err(ApiError::Forbidden("Must be an admin to edit services".to_string()));
    }
    if let Some(mut result) = services.get(id).await {
        result.add_grant(grant.into_inner());
        if let Ok(_) = services.save(result.clone()).await {
            Ok(Json(result))
        } else {
            Err(ApiError::Internal("Failed to update service".to_string()))
        }
    } else {
        Err(ApiError::NotFound("Unknown service ID".to_string()))
    }
}

#[post("/<id>/grants/<grant_id>", data = "<grant>")]
async fn update_service_grant(
    user: AuthUser,
    services: Docs<Service>,
    id: &str,
    grant_id: &str,
    grant: Json<ServiceGrant>
) -> ApiResult<Service> {
    if user.kind != UserType::Admin {
        return Err(ApiError::Forbidden("Must be an admin to edit services".to_string()));
    }
    if let Some(mut result) = services.get(id).await {
        if result.grants.contains_key(&grant_id.to_string()) {
            result.modify_grant(grant_id, grant.into_inner());
            if let Ok(_) = services.save(result.clone()).await {
                Ok(Json(result))
            } else {
                Err(ApiError::Internal("Failed to update service".to_string()))
            }
        } else {
            Err(ApiError::NotFound("Unknown grant ID".to_string()))
        }
    } else {
        Err(ApiError::NotFound("Unknown service ID".to_string()))
    }
}

#[get("/<id>/grants/<grant_id>")]
async fn get_service_grant(
    user: AuthUser,
    services: Docs<Service>,
    id: &str,
    grant_id: &str
) -> ApiResult<ServiceGrant> {
    if user.kind != UserType::Admin {
        return Err(ApiError::Forbidden("Must be an admin to get service grant data".to_string()));
    }
    if let Some(result) = services.get(id).await {
        if let Some(grant) = result.get_grant(grant_id) {
            Ok(Json(grant))
        } else {
            Err(ApiError::NotFound("Unknown grant ID".to_string()))
        }
    } else {
        Err(ApiError::NotFound("Unknown service ID".to_string()))
    }
}

#[delete("/<id>/grants/<grant_id>")]
async fn delete_service_grant(
    user: AuthUser,
    services: Docs<Service>,
    id: &str,
    grant_id: &str
) -> ApiResult<Service> {
    if user.kind != UserType::Admin {
        return Err(ApiError::Forbidden("Must be an admin to edit services".to_string()));
    }
    if let Some(mut result) = services.get(id).await {
        if result.grants.contains_key(&grant_id.to_string()) {
            result.remove_grant(grant_id);
            if let Ok(_) = services.save(result.clone()).await {
                Ok(Json(result))
            } else {
                Err(ApiError::Internal("Failed to update service".to_string()))
            }
        } else {
            Err(ApiError::NotFound("Unknown grant ID".to_string()))
        }
    } else {
        Err(ApiError::NotFound("Unknown service ID".to_string()))
    }
}

#[get("/<id>/grants/<grant_id>/validated")]
async fn validate_plugin_grant(
    user: AuthUser,
    services: Docs<Service>,
    plugins: PluginRegistry,
    id: &str,
    grant_id: &str
) -> ApiResult<(ServiceGrant, ValidationResult)> {
    if user.kind != UserType::Admin {
        return Err(ApiError::Forbidden("Must be an admin to validate services".to_string()));
    }

    if let Some(result) = services.get(id).await {
        if let Some(grant) = result.get_grant(grant_id) {
            if
                let ServiceGrant::Grant {
                    plugin_id,
                    grant_id: grant_key,
                    options,
                    ..
                } = grant.clone()
            {
                if let Some(plugin) = plugins.get(plugin_id.to_string()).await {
                    if let Some(grant_params) = plugin.get_grant(grant_key) {
                        let valid = grant_params.options.validate(options);
                        Ok(Json((grant, valid)))
                    } else {
                        Err(ApiError::NotFound("Grant contains unknown grant key".to_string()))
                    }
                } else {
                    Err(ApiError::NotFound("Grant contains unknown plugin ID".to_string()))
                }
            } else {
                Err(ApiError::MethodNotAllowed("Cannot validate non-plugin grants".to_string()))
            }
        } else {
            Err(ApiError::NotFound("Unknown grant ID".to_string()))
        }
    } else {
        Err(ApiError::NotFound("Unknown service ID".to_string()))
    }
}

#[derive(Deserialize)]
struct ServiceGrantTestModel {
    pub dry_run: bool,
    pub arguments: ParameterMap,
}

#[post("/<id>/grants/<grant_id>/test", data = "<test>")]
async fn test_grant(
    user: AuthUser,
    services: Docs<Service>,
    configs: Docs<PluginConfiguration>,
    plugins: PluginRegistry,
    id: &str,
    grant_id: &str,
    test: Json<ServiceGrantTestModel>
) -> ApiResult<Vec<GrantResource>> {
    if user.kind != UserType::Admin {
        return Err(ApiError::forbidden("Must be an admin to test grant execution"));
    }

    if let Some(result) = services.get(id).await {
        if let Some(grant) = result.get_grant(grant_id) {
            if
                let ServiceGrant::Grant {
                    plugin_id,
                    grant_id: grant_key,
                    config_id,
                    options,
                    ..
                } = grant.clone()
            {
                if let Some(plugin) = plugins.get(plugin_id.to_string()).await {
                    if let Some(action) = plugin.get_grant(grant_key) {
                        if let Some(config) = configs.get(config_id).await {
                            match
                                plugin.call::<_, Vec<GrantResource>>(
                                    action.method.clone(),
                                    GrantActionParams {
                                        dry_run: test.dry_run,
                                        action: action.clone(),
                                        plugin_config: config.options.clone().into(),
                                        service_config: options.clone().into(),
                                        user_arguments: test.arguments.clone(),
                                    }
                                ).await
                            {
                                Ok(resources) => Ok(Json(resources)),
                                Err((error, code)) =>
                                    Err(
                                        ApiError::internal(
                                            format!("Execution failed with code {code}: {error:?}")
                                        )
                                    ),
                            }
                        } else {
                            Err(ApiError::NotFound("Grant contains unknown config ID".to_string()))
                        }
                    } else {
                        Err(ApiError::NotFound("Grant contains unknown grant key".to_string()))
                    }
                } else {
                    Err(ApiError::NotFound("Grant contains unknown plugin ID".to_string()))
                }
            } else {
                Err(ApiError::MethodNotAllowed("Cannot test non-plugin grants".to_string()))
            }
        } else {
            Err(ApiError::NotFound("Unknown grant ID".to_string()))
        }
    } else {
        Err(ApiError::NotFound("Unknown service ID".to_string()))
    }
}

pub fn routes() -> Vec<Route> {
    return routes![
        create_service,
        get_services,
        get_service_by_id,
        delete_service,
        update_service,
        create_service_grant,
        update_service_grant,
        delete_service_grant,
        get_service_grant,
        validate_plugin_grant,
        test_grant
    ];
}
