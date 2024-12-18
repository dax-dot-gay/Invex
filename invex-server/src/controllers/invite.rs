use bson::doc;
use rocket::{ serde::json::Json, Route };
use serde::{ Deserialize, Serialize };

use crate::{
    models::{
        auth::{ AuthUser, UserType },
        error::ApiError,
        invite::{ Expiration, Invite, InviteUsage, ResolvedExpiration },
        service::Service,
    },
    util::{ database::{ Docs, Id, PaginationRequest, PaginationResult }, ApiResult, InResult },
};

#[derive(Serialize, Deserialize, Clone, Debug)]
struct InviteInfo {
    pub id: String,
    pub invite: Invite,
    pub expires: ResolvedExpiration,
    pub services: Vec<Service>,
    pub usages: Vec<InviteUsage>,
}

impl InviteInfo {
    pub async fn build(
        invite: &Invite,
        services: &Docs<Service>,
        usages: &Docs<InviteUsage>
    ) -> InResult<Self> {
        let service_refs = services.query_many(doc! { "_id": {"$in": invite.services.iter().map(|s| s.to_string()).collect::<Vec<String>>()} }).await?;
        let usage_refs = usages.query_many(doc! { "invite_id": invite.id.to_string() }).await?;
        Ok(InviteInfo {
            id: invite.id.to_string(),
            invite: invite.clone(),
            services: service_refs
                .iter()
                .filter_map(|s| (
                    if invite.services.contains(&s.id) {
                        Some(s.clone())
                    } else {
                        None
                    }
                ))
                .collect(),
            usages: usage_refs
                .iter()
                .filter_map(|u| (
                    if u.invite_id.clone() == invite.id.clone() {
                        Some(u.clone())
                    } else {
                        None
                    }
                ))
                .collect(),
            expires: invite.expires()
        })
    }
}

#[get("/?<pagination..>")]
async fn list_invites(
    user: AuthUser,
    invites: Docs<Invite>,
    services: Docs<Service>,
    usages: Docs<InviteUsage>,
    pagination: Option<PaginationRequest>
) -> ApiResult<PaginationResult<InviteInfo>> {
    if user.kind != UserType::Admin {
        return Err(ApiError::Forbidden("Must be an admin to list invites".to_string()));
    }

    if let Ok(paginated) = invites.paginate(doc! {}, pagination).await {
        let ids = paginated.results
            .iter()
            .map(|i| i.id.to_string())
            .collect::<Vec<String>>();
        let service_ids = paginated.results.iter().fold(Vec::<String>::new(), |mut accum, current| {
            for sid in current.services.clone() {
                if !accum.contains(&sid.to_string()) {
                    accum.push(sid.to_string());
                }
            }
            accum
        });
        if
            let Ok(service_refs) = services.query_many(
                doc! { "_id": {"$in": service_ids.clone()} }
            ).await
        {
            if
                let Ok(usage_refs) = usages.query_many(
                    doc! { "invite_id": {"$in": ids.clone()} }
                ).await
            {
                let result = paginated.results
                    .iter()
                    .map(|invite| {
                        InviteInfo {
                            id: invite.id.to_string(),
                            invite: invite.clone(),
                            services: service_refs
                                .iter()
                                .filter_map(|s| (
                                    if invite.services.contains(&s.id) {
                                        Some(s.clone())
                                    } else {
                                        None
                                    }
                                ))
                                .collect(),
                            usages: usage_refs
                                .iter()
                                .filter_map(|u| (
                                    if u.invite_id.clone() == invite.id.clone() {
                                        Some(u.clone())
                                    } else {
                                        None
                                    }
                                ))
                                .collect(),
                            expires: invite.expires()
                        }
                    })
                    .collect::<Vec<InviteInfo>>();
                Ok(
                    Json(PaginationResult {
                        offset: paginated.offset,
                        total: paginated.total,
                        results: result,
                    })
                )
            } else {
                Err(ApiError::Internal("Failed to query invite usages".to_string()))
            }
        } else {
            Err(ApiError::Internal("Failed to query related services".to_string()))
        }
    } else {
        Err(ApiError::Internal("Failed to list invites".to_string()))
    }
}

#[get("/<id>")]
async fn get_invite(
    user: AuthUser,
    invites: Docs<Invite>,
    services: Docs<Service>,
    usages: Docs<InviteUsage>,
    id: &str
) -> ApiResult<InviteInfo> {
    if user.kind != UserType::Admin {
        return Err(ApiError::Forbidden("Must be an admin to retrieve invites".to_string()));
    }

    if let Some(invite) = invites.get(id).await {
        if let Ok(info) = InviteInfo::build(&invite, &services, &usages).await {
            Ok(Json(info))
        } else {
            Err(ApiError::Internal("Failed to hydrate invite data".to_string()))
        }
    } else {
        Err(ApiError::NotFound("Requested invite not found".to_string()))
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
struct InviteCreationModel {
    pub code: String,
    #[serde(default)]
    pub expires: Option<Expiration>,
    pub services: Vec<Id>,
}

#[post("/", data = "<model>")]
async fn create_invite(
    user: AuthUser,
    invites: Docs<Invite>,
    services: Docs<Service>,
    model: Json<InviteCreationModel>
) -> ApiResult<InviteInfo> {
    if user.kind != UserType::Admin {
        return Err(ApiError::Forbidden("Must be an admin to create invites".to_string()));
    }

    if invites.exists(doc! {"code": model.code.clone()}).await {
        return Err(ApiError::MethodNotAllowed("Requested invite code already exists".to_string()));
    }

    if let Ok(service_refs) = services.query_many(doc! {"_id": {"$in": model.services.clone().iter().map(|s| s.to_string()).collect::<Vec<String>>()}}).await {
        if service_refs.len() != model.services.len() {
            return Err(ApiError::BadRequest("Some service IDs were unknown".to_string()));
        }

        let invite = Invite {
            id: Id::default(),
            code: model.code.clone(),
            created_by: user.id.clone(),
            expires: model.expires.clone(),
            services: model.services.clone()
        };

        if let Ok(_) = invites.save(invite.clone()).await {
            Ok(Json(InviteInfo {
                id: invite.id.to_string(),
                invite: invite.clone(),
                services: service_refs.clone(),
                usages: Vec::new(),
                expires: invite.expires()
            }))
        } else {
            Err(ApiError::Internal("Failed to save invite".to_string()))
        }
    } else {
        Err(ApiError::Internal("Failed to get service references".to_string()))
    }
}

pub fn routes() -> Vec<Route> {
    return routes![list_invites, get_invite, create_invite];
}
