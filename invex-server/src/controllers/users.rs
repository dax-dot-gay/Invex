use bson::doc;
use rocket::{serde::json::Json, Route};
use serde::{Deserialize, Serialize};
use regex::escape;

use crate::{
    models::{
        auth::{AuthUser, ClientUser, UserType},
        error::ApiError,
    },
    util::{
        database::{Docs, PaginationRequest, PaginationResult},
        ApiResult,
    },
};

#[get("/?<search>&<kind>&<pagination..>")]
async fn list_users(
    user: AuthUser,
    users: Docs<AuthUser>,
    pagination: Option<PaginationRequest>,
    search: Option<String>,
    kind: Option<UserType>,
) -> Result<Json<PaginationResult<ClientUser>>, ApiError> {
    if user.kind != UserType::Admin {
        return Err(ApiError::Forbidden(
            "Must be an admin to list users".to_string(),
        ));
    }

    let mut query = doc! {};
    if let Some(search_val) = search {
        query = doc! {
            "$or": [
                {"username": {"$regex": escape(search_val.as_str())}}, 
                {"email": {"$regex": escape(search_val.as_str())}}
            ]
        };
    }

    if let Some(kind_val) = kind {
        let _ = query.insert("kind", kind_val.to_string());
    }

    match users.paginate(query, pagination).await {
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

#[derive(Serialize, Deserialize, Clone, Debug)]
struct UserCreationModel {
    pub kind: UserType,
    pub username: String,

    #[serde(default)]
    pub email: Option<String>,
    pub password: String,
}

#[post("/create", data = "<new_user>")]
async fn create_user(
    new_user: Json<UserCreationModel>,
    user: AuthUser,
    users: Docs<AuthUser>,
) -> ApiResult<ClientUser> {
    if user.kind != UserType::Admin {
        return Err(ApiError::Forbidden(
            "Must be an admin to create users".to_string(),
        ));
    }

    if let Ok(Some(_)) = users
        .find_one(if new_user.email.is_some() {
            doc! {"$or": [{"username": new_user.username.clone()}, {"email": new_user.email.clone().unwrap()}]}
        } else {
            doc! {"username": new_user.username.clone()}
        })
        .await
    {
        return Err(ApiError::MethodNotAllowed(
            "A user with this username/email already exists".to_string(),
        ));
    }

    if let Ok(created) = match new_user.kind {
        UserType::Admin => AuthUser::new_admin(
            new_user.username.clone(),
            new_user.email.clone(),
            new_user.password.clone(),
        ),
        UserType::User => AuthUser::new_user(
            new_user.username.clone(),
            new_user.email.clone(),
            new_user.password.clone(),
        ),
    } {
        if let Ok(_) = users.save(created.clone()).await {
            Ok(Json(created.into()))
        } else {
            Err(ApiError::Internal("Failed to store new user".to_string()))
        }
    } else {
        Err(ApiError::Internal(
            "Failed to create user object".to_string(),
        ))
    }
}

#[delete("/<user_id>")]
async fn delete_user(user_id: String, user: AuthUser, users: Docs<AuthUser>) -> Result<(), ApiError> {
    if user.kind != UserType::Admin {
        return Err(ApiError::Forbidden(
            "Must be an admin to delete users".to_string(),
        ));
    }

    if user.id.to_string() == user_id {
        return Err(ApiError::MethodNotAllowed(
            "Cannot delete own user".to_string(),
        ));
    }

    let _ = users.delete_one(doc! {"_id": user_id}).await;
    Ok(())
}

pub fn routes() -> Vec<Route> {
    return routes![list_users, create_user, delete_user];
}
