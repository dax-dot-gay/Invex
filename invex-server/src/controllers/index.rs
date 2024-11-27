use chrono::Utc;
use rocket::{serde::json::Json, Route};

use crate::{models::{auth::{AuthSession, AuthUser}, server::ServerInfo}, util::{database::Document, guards::Conf}};

#[allow(dead_code)]
#[get("/")]
fn index_auth(user: AuthUser, session: AuthSession, config: Conf) -> Json<ServerInfo> {
    Json(ServerInfo {
        profile: config.profile.to_string(),
        request_time: Utc::now(),
        session: session.id(),
        user: Some(user.into())
    })
}

#[allow(dead_code)]
#[get("/", rank = 2)]
fn index_non_auth(session: AuthSession, config: Conf) -> Json<ServerInfo> {
    Json(ServerInfo {
        profile: config.profile.to_string(),
        request_time: Utc::now(),
        session: session.id(),
        user: None
    })
}

pub fn routes() -> Vec<Route> {
    routes![index_auth, index_non_auth]
}