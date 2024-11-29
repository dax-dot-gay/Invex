use bson::doc;
use rocket::{futures::TryStreamExt, serde::json::Json, Route};

use crate::{
    models::{
        auth::{AuthUser, ClientUser, UserType},
        error::ApiError,
    },
    util::database::{Docs, PaginationRequest, PaginationResult},
};

#[get("/?<pagination..>")]
async fn list_users(
    user: AuthUser,
    users: Docs<AuthUser>,
    pagination: PaginationRequest,
) -> Result<Json<PaginationResult<ClientUser>>, ApiError> {
    if user.kind != UserType::Admin {
        return Err(ApiError::Forbidden(
            "Must be an admin to list users".to_string(),
        ));
    }

    match users.paginate(doc! {}, pagination).await {
        Ok(results) => {
            let transformed_results = PaginationResult::<ClientUser> {
                offset: results.clone().offset,
                total: results.clone().total,
                results: results
                    .clone()
                    .results
                    .iter()
                    .map(|v| v.clone().into())
                    .collect(),
            };
            Ok(Json(transformed_results))
        }
        Err(e) => Err(ApiError::Internal(format!("Failed to list users: {e:?}"))),
    }
}

#[get("/all")]
async fn list_all_users(
    user: AuthUser,
    users: Docs<AuthUser>,
) -> Result<Json<Vec<ClientUser>>, ApiError> {
    if user.kind != UserType::Admin {
        return Err(ApiError::Forbidden(
            "Must be an admin to list all users".to_string(),
        ));
    }

    match users.find(doc! {}).await {
        Ok(results) => Ok(Json(
            results
                .try_collect::<Vec<AuthUser>>()
                .await
                .or_else(|e| Err(ApiError::Internal(format!("Failed to list users: {e:?}"))))?
                .iter()
                .map(|v| v.clone().into())
                .collect(),
        )),
        Err(e) => Err(ApiError::Internal(format!("Failed to list users: {e:?}"))),
    }
}

pub fn routes() -> Vec<Route> {
    return routes![list_users, list_all_users];
}
