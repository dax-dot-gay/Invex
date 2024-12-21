use bson::doc;
use rocket::{ request::{ self, FromRequest }, response::Responder, Request, Route };
use serde::{ Deserialize, Serialize };

use crate::{
    models::{ auth::AuthUser, error::ApiError, invite::{ Invite, InviteUsage } },
    util::database::Docs,
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

pub fn routes() -> Vec<Route> {
    routes![]
}
