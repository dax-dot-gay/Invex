use std::error::Error;

use bevy_reflect::Reflect;
use chrono::{DateTime, TimeDelta, Utc};
use invex_macros::Document;
use mongodb::Database;
use rocket::{fairing::{Fairing, Info, Kind}, http::{Cookie, Header, Status}, request::{FromRequest, Outcome}, time::OffsetDateTime, Data, Request};
use serde::{Deserialize, Serialize};
use bson::doc;
use crate::{config::Config, util::{crypto::{CipherData, HashedPassword, SecretKey}, database::{Docs, Document, Id}}};

use super::error::ApiError;

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

#[rocket::async_trait]
impl<'r> FromRequest<'r> for AuthSession {
    type Error = ApiError;

    async fn from_request(req:&'r Request<'_>) -> Outcome<Self, Self::Error> {
        let sessions = Docs::<AuthSession>::new(req.rocket().state::<Database>().expect("Database not initialized").clone());
        let token = req.headers().get("TOKEN").last().expect("Session header not set (fairing inactive?)").to_string();
        if let Some(session) = sessions.get(token).await {
            Outcome::Success(session)
        } else {
            Outcome::Error((Status::BadRequest, ApiError::Internal("Invalid session token".to_string())))
        }
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
        let config = request.rocket().state::<Config>().expect("Config not present in state");
        let database = request.rocket().state::<Database>().expect("Database not present in state");
        let sessions = Docs::<AuthSession>::new(database.clone());
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
    }
}

#[derive(Serialize, Deserialize, Clone, Debug, Reflect)]
#[serde(tag = "type")]
pub enum AuthUser {
    User {
        #[serde(default, rename = "_id")]
        id: Id,
        username: String,
        password: HashedPassword,
        secret_key: CipherData
    },
    Admin {
        #[serde(default, rename = "_id")]
        id: Id,
        username: String,
        password: HashedPassword,
        secret_key: CipherData
    },
    Ephemeral {
        #[serde(default, rename = "_id")]
        id: Id,
        invite: Id
    }
}

impl Document for AuthUser {
    fn id(&self) -> String {
        match self {
            AuthUser::Admin { id, ..} => id.to_string(),
            AuthUser::User {id, ..} => id.to_string(),
            AuthUser::Ephemeral {id, ..} => id.to_string()
        }
    }
}

impl AuthUser {
    pub fn new_user(username: String, password: String) -> Result<Self, Box<dyn Error>> {
        let hashed_pass = HashedPassword::new(password.clone())?;
        let encryption_key = SecretKey::default();
        let password_key = SecretKey::derive(password.clone())?;
        let encrypted_key = password_key.encrypt(encryption_key)?;

        Ok(AuthUser::User { id: Id::default(), username, password: hashed_pass, secret_key: encrypted_key })
    }

    pub fn new_admin(username: String, password: String) -> Result<Self, Box<dyn Error>> {
        let hashed_pass = HashedPassword::new(password.clone())?;
        let encryption_key = SecretKey::default();
        let password_key = SecretKey::derive(password.clone())?;
        let encrypted_key = password_key.encrypt(encryption_key)?;

        Ok(AuthUser::Admin { id: Id::default(), username, password: hashed_pass, secret_key: encrypted_key })
    }

    pub fn verify_password(&self, test: String) -> bool {
        match self {
            AuthUser::Ephemeral{..} => false,
            AuthUser::Admin{password, ..} => password.verify(test),
            AuthUser::User{password, ..} => password.verify(test)
        }
    }

    pub fn is_admin(&self) -> bool {
        if let AuthUser::Admin{..} = self {
            true
        } else {
            false
        }
    }

    pub fn is_user(&self) -> bool {
        if let AuthUser::User{..} = self {
            true
        } else {
            false
        }
    }

    pub fn is_ephemeral(&self) -> bool {
        if let AuthUser::Ephemeral{..} = self {
            true
        } else {
            false
        }
    }
}

#[rocket::async_trait]
impl<'r> FromRequest<'r> for AuthUser {
    type Error = ApiError;

    async fn from_request(req:&'r Request<'_>) -> Outcome<Self, Self::Error> {
        let users = Docs::<AuthUser>::new(req.rocket().state::<Database>().expect("Database not initialized").clone());
        let sessions = Docs::<AuthSession>::new(req.rocket().state::<Database>().expect("Database not initialized").clone());
        if let Outcome::Success(mut session) = req.guard::<AuthSession>().await {
            if session.user_id.is_none() {
                return Outcome::Error((Status::Unauthorized, ApiError::AuthenticationRequired));
            }

            if let Some(user) = users.get(session.clone().user_id.unwrap().to_string()).await {
                Outcome::Success(user)
            } else {
                session.clear_key();
                session.user_id = None;
                let _ = sessions.save(session.clone()).await;
                return Outcome::Error((Status::Unauthorized, ApiError::AuthenticationRequired));
            }
        } else {
            Outcome::Error((Status::BadRequest, ApiError::Internal("Invalid session token".to_string())))
        }
    }
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum ClientUser {
    User {
        id: Id,
        username: String
    },
    Admin {
        id: Id,
        username: String
    },
    Ephemeral {
        id: Id,
        invite: Id
    }
}