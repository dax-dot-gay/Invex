use bson::doc;
use rocket::{futures::TryStreamExt, serde::json::Json, Route};
use serde::Deserialize;

use crate::{
    models::{
        auth::{AuthUser, UserType},
        error::ApiError,
        service::{Service, ServiceGrant},
    },
    util::{database::Docs, ApiResult},
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
    model: Json<ServiceCreateModel>,
) -> ApiResult<Service> {
    if user.kind != UserType::Admin {
        return Err(ApiError::Forbidden(
            "Must be an admin to create services".to_string(),
        ));
    }
    let created = Service::create(
        model.name.clone(),
        model.icon.clone(),
        model.description.clone(),
    );
    if let Ok(_) = services.save(created.clone()).await {
        Ok(Json(created))
    } else {
        Err(ApiError::Internal(
            "Failed to create new Service".to_string(),
        ))
    }
}

#[get("/")]
async fn get_services(user: AuthUser, services: Docs<Service>) -> ApiResult<Vec<Service>> {
    if user.kind != UserType::Admin {
        return Err(ApiError::Forbidden(
            "Must be an admin to list all services".to_string(),
        ));
    }
    if let Ok(cursor) = services.find(doc! {}).await {
        if let Ok(results) = cursor.try_collect::<Vec<Service>>().await {
            Ok(Json(results))
        } else {
            Err(ApiError::Internal("Failed to list services".to_string()))
        }
    } else {
        Err(ApiError::Internal("Failed to list services".to_string()))
    }
}

#[get("/<id>")]
async fn get_service_by_id(
    user: AuthUser,
    services: Docs<Service>,
    id: &str,
) -> ApiResult<Service> {
    if user.kind != UserType::Admin {
        return Err(ApiError::Forbidden(
            "Must be an admin to get services".to_string(),
        ));
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
        return Err(ApiError::Forbidden(
            "Must be an admin to delete services".to_string(),
        ));
    }
    if let Ok(_) = services.delete_one(doc! {"_id": id}).await {
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
    model: Json<ServiceCreateModel>,
) -> ApiResult<Service> {
    if user.kind != UserType::Admin {
        return Err(ApiError::Forbidden(
            "Must be an admin to edit services".to_string(),
        ));
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
    grant: Json<ServiceGrant>,
) -> ApiResult<Service> {
    if user.kind != UserType::Admin {
        return Err(ApiError::Forbidden(
            "Must be an admin to edit services".to_string(),
        ));
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
    grant: Json<ServiceGrant>,
) -> ApiResult<Service> {
    if user.kind != UserType::Admin {
        return Err(ApiError::Forbidden(
            "Must be an admin to edit services".to_string(),
        ));
    }
    if let Some(mut result) = services.get(id).await {
        if result.grants.contains_key(&grant_id.to_string().into()) {
            result.modify_grant(id, grant.into_inner());
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
    grant_id: &str,
) -> ApiResult<ServiceGrant> {
    if user.kind != UserType::Admin {
        return Err(ApiError::Forbidden(
            "Must be an admin to get service grant data".to_string(),
        ));
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
    grant_id: &str,
) -> ApiResult<Service> {
    if user.kind != UserType::Admin {
        return Err(ApiError::Forbidden(
            "Must be an admin to edit services".to_string(),
        ));
    }
    if let Some(mut result) = services.get(id).await {
        if result.grants.contains_key(&grant_id.to_string().into()) {
            result.remove_grant(id);
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
        get_service_grant
    ];
}
