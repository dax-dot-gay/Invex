use bson::doc;
use rocket::{futures::TryStreamExt, serde::json::Json, Route};

use crate::{
    models::{
        auth::{AuthUser, ClientUser, UserType},
        error::ApiError,
    },
    util::database::{Docs, PaginationRequest, PaginationResult},
};

#[get("/?<search>&<kind>&<pagination..>")]
async fn list_users(
    user: AuthUser,
    users: Docs<AuthUser>,
    pagination: Option<PaginationRequest>,
    search: Option<String>,
    kind: Option<UserType>
) -> Result<Json<PaginationResult<ClientUser>>, ApiError> {
    if user.kind != UserType::Admin {
        return Err(ApiError::Forbidden(
            "Must be an admin to list users".to_string(),
        ));
    }

    let mut query = doc! {};
    if let Some(search_val) = search {
        let _ = query.insert("$text", doc! {"$search": search_val});
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

pub fn routes() -> Vec<Route> {
    return routes![list_users];
}
