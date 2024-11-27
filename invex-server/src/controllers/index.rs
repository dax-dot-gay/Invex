use chrono::Utc;
use rocket::{serde::json::Json, Route, State};

use crate::{config::Config, models::{auth::{AuthSession, AuthUser}, server::ServerInfo}, util::{database::Document, guards::Conf}};

#[allow(dead_code)]
#[get("/")]
fn index_auth(user: AuthUser, session: AuthSession, config: Conf, custom_config: &State<Config>) -> Json<ServerInfo> {
    Json(ServerInfo {
        profile: config.profile.to_string(),
        request_time: Utc::now(),
        session: session.id(),
        user: Some(user.into()),
        customization: custom_config.customization.clone()
    })
}

#[allow(dead_code)]
#[get("/", rank = 2)]
fn index_non_auth(session: AuthSession, config: Conf, custom_config: &State<Config>) -> Json<ServerInfo> {
    Json(ServerInfo {
        profile: config.profile.to_string(),
        request_time: Utc::now(),
        session: session.id(),
        user: None,
        customization: custom_config.customization.clone()
    })
}

pub fn routes() -> Vec<Route> {
    routes![index_auth, index_non_auth]
}