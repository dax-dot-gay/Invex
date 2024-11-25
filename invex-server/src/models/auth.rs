use bevy_reflect::Reflect;
use chrono::{DateTime, TimeDelta, Utc};
use couch_rs::{document::TypedCouchDocument, types::document::DocumentId, Client, CouchDocument};
use rocket::{fairing::{Fairing, Info, Kind}, http::{Cookie, Header}, time::OffsetDateTime, Data, Request};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::config::Config;

use super::Docs;

#[derive(Serialize, Deserialize, Clone, Debug, Reflect, CouchDocument)]
pub struct AuthSession {
    #[serde(default = "crate::util::new_id")]
    pub _id: DocumentId,
    #[serde(skip_serializing_if = "String::is_empty")]
    pub _rev: String,
    #[serde(default = "Utc::now")]
    #[reflect(ignore)]
    pub created: DateTime<Utc>,
    pub user_id: Option<Uuid>
}

impl AuthSession {
    pub fn generate() -> Self {
        AuthSession { _id: crate::util::new_id(), _rev: String::new(), created: Utc::now(), user_id: None }
    }

    pub fn get_expiry(&self, config: Config) -> DateTime<Utc> {
        self.created + TimeDelta::from_std(config.session_duration.into()).expect("Invalid session length (out of range)")
    }
}

#[derive(Serialize, Deserialize, Clone, Debug, Reflect, CouchDocument)]
pub struct AuthUser {
    #[serde(default = "crate::util::new_id")]
    pub _id: DocumentId,
    #[serde(skip_serializing_if = "String::is_empty")]
    pub _rev: String,
    pub username: String,
    pub email: String,
    pub password: String
}

pub struct SessionFairing;

#[rocket::async_trait]
impl Fairing for SessionFairing {
    fn info(&self) -> Info {
        Info {
            name: "Fairing to ensure existence & validity of session cookie",
            kind: Kind::Request
        }
    }

    async fn on_request(&self, request: &mut Request<'_>, _: &mut Data<'_>) {
        if let Some(config) = request.rocket().state::<Config>() {
            if let Some(client) = request.rocket().state::<Client>() {
                if let Ok(sessions) = Docs::<AuthSession>::new(client.clone()).await {
                    if let Some(cookie) = request.cookies().get_private("invex:token") {
                        if let Ok(existing) = sessions.get(cookie.value()).await {
                            if existing.get_expiry(config.clone()) > Utc::now() {
                                request.add_header(Header::new("TOKEN", existing._id));
                                return;
                            }
                            sessions.remove(&existing).await;
                        }
                        request.cookies().remove_private(cookie);
                    }

                    let mut new_id = AuthSession::generate();
                    let _ = sessions.save(&mut new_id).await;
                    request.cookies().add_private(Cookie::build(("invex:token", new_id._id.clone())).expires(OffsetDateTime::from_unix_timestamp(new_id.get_expiry(config.clone()).timestamp()).expect("Expiration out of range")));
                }
            }
        }
    }
}