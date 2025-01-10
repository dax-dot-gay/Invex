use std::collections::HashMap;

use bson::doc;
use chrono::Utc;
use invex_sdk::PluginArgument;
use rocket::{ request::{ self, FromRequest }, response::Responder, serde::json::Json, Request, Route };
use serde::{ Deserialize, Serialize };

use crate::{
    models::{
        auth::AuthUser,
        error::ApiError,
        invite::{ Invite, InviteUsage, ResolvedExpiration },
        plugin::PluginRegistry,
        service::{ Service, ServiceGrant },
    },
    util::{ database::{ Collections, Docs, Document, Id }, ApiResult },
};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct UsingInvite {
    pub usage: InviteUsage,
    pub user: AuthUser,
    pub invite: Invite,
}

impl<'r> UsingInvite {
    async fn parse(req: &'r Request<'_>) -> Result<Self, ApiError> {
        let code = req
            .headers()
            .get_one("X-InvexCode")
            .ok_or(
                ApiError::BadRequest("Request must include the X-InvexCode header".to_string())
            )?;
        let usages = req
            .guard::<Docs<InviteUsage>>().await
            .success_or(ApiError::Internal("Failed to fetch usages".to_string()))?;
        let user = req
            .guard::<AuthUser>().await
            .success_or(ApiError::AuthenticationRequired("Must be authenticated".to_string()))?;
        let invites = req
            .guard::<Docs<Invite>>().await
            .success_or(ApiError::Internal("Failed to fetch invites".to_string()))?;

        let usage = usages
            .query_one(doc! { "invite_code": code, "user": user.id.to_string() }).await
            .ok_or(ApiError::NotFound("Specified invite not used by you.".to_string()))?;
        let invite = invites
            .get(usage.invite_id.to_string()).await
            .ok_or(ApiError::NotFound("Associated invite does not exist".to_string()))?;

        Ok(Self {
            usage,
            user,
            invite,
        })
    }
}

#[rocket::async_trait]
impl<'r> FromRequest<'r> for UsingInvite {
    type Error = ApiError;

    async fn from_request(req: &'r Request<'_>) -> request::Outcome<Self, Self::Error> {
        match Self::parse(&req).await {
            Ok(s) => request::Outcome::Success(s),
            Err(e) => {
                let resp = e.clone().respond_to(req);
                request::Outcome::Error((
                    match resp {
                        Ok(r) => r.status(),
                        Err(s) => s,
                    },
                    e,
                ))
            }
        }
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct RedeemingGrant {
    pub plugin: String,
    pub key: String,
    pub label: String,
    pub description: Option<String>,
    pub icon: Option<String>,
    pub arguments: Vec<PluginArgument>,
    pub revocable: bool,
    pub url: Option<String>,
    pub help: Option<String>,
}

impl RedeemingGrant {
    pub async fn from_ids(
        plugin_id: impl AsRef<str>,
        grant_id: impl AsRef<str>,
        url: Option<String>,
        help: Option<String>,
        plugins: &PluginRegistry
    ) -> Result<Self, ApiError> {
        if let Some(plugin) = plugins.get(plugin_id).await {
            if let Some(grant) = plugin.get_grant(grant_id) {
                Ok(Self {
                    plugin: plugin.id(),
                    key: grant.key.clone(),
                    label: grant.label.clone(),
                    description: grant.description.clone(),
                    icon: grant.icon.clone(),
                    arguments: grant.arguments.clone(),
                    revocable: grant.revoke_method.is_some(),
                    url,
                    help,
                })
            } else {
                Err(ApiError::NotFound("Unknown grant ID".to_string()))
            }
        } else {
            Err(ApiError::NotFound("Unknown plugin ID".to_string()))
        }
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct RedeemingService {
    pub id: String,
    pub name: String,
    pub icon: Option<String>,
    pub description: Option<String>,
    pub actions: HashMap<String, RedeemingGrant>,
    pub additional_grants: i64,
}

impl RedeemingService {
    pub async fn from_id(
        id: Id,
        collections: Collections,
        plugins: &PluginRegistry
    ) -> Result<Self, ApiError> {
        let services = collections.get::<Service>();
        if let Some(service) = services.get(id.clone()).await {
            let mut additional_grants: i64 = 0;
            let mut actions: HashMap<String, RedeemingGrant> = HashMap::new();
            for (key, grant) in &service.grants {
                if let ServiceGrant::Grant { plugin_id, grant_id, url, help, .. } = grant {
                    actions.insert(
                        key.clone(),
                        RedeemingGrant::from_ids(
                            plugin_id.to_string(),
                            grant_id.to_string(),
                            url.clone(),
                            help.clone(),
                            plugins
                        ).await?
                    );
                } else {
                    additional_grants += 1;
                }
            }
            Ok(Self {
                id: service.id.to_string(),
                name: service.name.clone(),
                icon: service.icon.clone(),
                description: service.description.clone(),
                actions,
                additional_grants,
            })
        } else {
            Err(ApiError::NotFound(format!("Unknown service ID {id}")))
        }
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct RedeemingInvite {
    pub invite: Invite,
    pub services: Vec<RedeemingService>,
}

impl RedeemingInvite {
    pub async fn from_invite(
        invite: &Invite,
        collections: Collections,
        plugins: &PluginRegistry
    ) -> Result<Self, ApiError> {
        let mut services = Vec::<RedeemingService>::new();
        for id in &invite.services {
            services.push(
                RedeemingService::from_id(id.clone(), collections.clone(), plugins).await?
            );
        }
        Ok(Self {
            invite: invite.clone(),
            services: services.clone(),
        })
    }
}

#[get("/info/<code>")]
async fn get_invite_info(invites: Docs<Invite>, usages: Docs<InviteUsage>, collections: Collections, plugins: PluginRegistry, code: &str) -> ApiResult<RedeemingInvite> {
    if let Some(invite) = invites.query_one(doc! {"code": code}).await {
        if let Ok(inv_usages) = usages.query_many(doc! {"invite_id": invite.id()}).await {
            let expired = match invite.expires() {
                ResolvedExpiration::Never => false,
                ResolvedExpiration::Datetime(datetime) => Utc::now() <= datetime,
                ResolvedExpiration::Uses(max_uses) => (inv_usages.len() as u64) < max_uses
            };
            if expired {
                Err(ApiError::not_found("Unknown invite code"))
            } else {
                Ok(Json(RedeemingInvite::from_invite(&invite, collections.clone(), &plugins).await?))
            }
        } else {
            Err(ApiError::internal("Failed to retrieve invite usages"))
        }
    } else {
        Err(ApiError::not_found("Unknown invite code"))
    }
}

pub fn routes() -> Vec<Route> {
    routes![get_invite_info]
}
