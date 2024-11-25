use std::error::Error;

use bevy_reflect::Reflect;
use chrono::{DateTime, TimeDelta, Utc};
use invex_macros::Document;
use mongodb::Database;
use rocket::{fairing::{Fairing, Info, Kind}, http::{Cookie, Header}, time::OffsetDateTime, Data, Request};
use serde::{Deserialize, Serialize};
use bson::doc;
use crate::{config::Config, util::{crypto::{CipherData, HashedPassword, SecretKey}, database::{Docs, Document, Id}}};

#[derive(Serialize, Deserialize, Clone, Debug, Reflect, Document)]
pub struct AuthSession {
    #[serde(default, rename = "_id")]
    pub id: Id,
    pub created: String,

    #[serde(default)]
    pub user_id: Option<Id>,

    #[serde(default)]
    pub session_key: Option<CipherData>
}

impl AuthSession {
    pub fn generate() -> Self {
        AuthSession::create(doc! {"created": Utc::now().to_rfc3339()}).expect("Invalid preset format")
    }

    pub fn created(&self) -> DateTime<Utc> {
        DateTime::parse_from_rfc3339(&self.created).expect("Invalid DT string").to_utc()
    }

    pub fn get_expiry(&self, config: Config) -> DateTime<Utc> {
        self.created() + TimeDelta::from_std(config.session_duration.into()).expect("Invalid session length (out of range)")
    }

    pub fn activate_key(&mut self, key: SecretKey) -> Result<SecretKey, Box<dyn Error>> {
        let new_key = SecretKey::default();
        self.session_key = Some(new_key.encrypt(key)?);
        Ok(new_key)
    }

    pub fn clear_key(&mut self) {
        self.session_key = None;
    }

    pub fn reveal_key(&self, client_key: SecretKey) -> Option<SecretKey> {
        if let Some(enc) = &self.session_key {
            if let Ok(decoded) = client_key.decrypt::<SecretKey>(enc.clone()) {
                return Some(decoded);
            }
        }
        None
    }
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
            if let Some(db) = request.rocket().state::<Database>() {
                let sessions = Docs::<AuthSession>::new(db.clone());
                if let Some(cookie) = request.cookies().get_private("invex:token") {
                    if let Some(existing) = sessions.get(cookie.value()).await {
                        if existing.get_expiry(config.clone()) > Utc::now() {
                            request.add_header(Header::new("TOKEN", existing.id()));
                            return;
                        }
                        let _ = sessions.delete_one(doc! {"_id": existing.id()}).await;
                    }
                    request.cookies().remove_private(cookie);
                }

                let new_id = AuthSession::generate();
                let _ = sessions.save(new_id.clone()).await;
                request.cookies().add_private(Cookie::build(("invex:token", new_id.clone().id())).expires(OffsetDateTime::from_unix_timestamp(new_id.get_expiry(config.clone()).timestamp()).expect("Expiration out of range")));
                request.add_header(Header::new("TOKEN", new_id.clone().id()));
                return;
            }
        }
        panic!("FAIL");
    }
}

#[derive(Serialize, Deserialize, Clone, Debug, Reflect, Document)]
pub struct AuthUser {
    #[serde(default, rename = "_id")]
    pub id: Id,
    pub username: String,
    pub password: HashedPassword,
    pub secret_key: CipherData
}

impl AuthUser {
    pub fn new(username: String, password: String) -> Result<Self, Box<dyn Error>> {
        let hashed_pass = HashedPassword::new(password.clone())?;
        let encryption_key = SecretKey::default();
        let password_key = SecretKey::derive(password.clone())?;
        let encrypted_key = password_key.encrypt(encryption_key)?;

        Ok(AuthUser { id: Id::default(), username, password: hashed_pass, secret_key: encrypted_key })
    }
}