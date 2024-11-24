use chrono::{DateTime, Utc};
use rocket::{request::{FromRequest, Outcome}, Request};
use serde::{Deserialize, Serialize};

use super::error::ApiError;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ServerInfo {
    pub profile: String,
    pub request_time: DateTime<Utc>
}

#[rocket::async_trait]
impl<'r> FromRequest<'r> for ServerInfo {
    type Error = ApiError;
    async fn from_request(req: &'r Request<'_>) -> Outcome<Self, Self::Error> {
        Outcome::Success(ServerInfo {profile: req.rocket().config().profile.to_string(), request_time: Utc::now()})
    }
}
