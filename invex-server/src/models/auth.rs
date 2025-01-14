use std::error::Error;

use bevy_reflect::Reflect;
use chrono::{DateTime, TimeDelta, Utc};
use invex_macros::Document;
use mongodb::Database;
use rocket::{fairing::{Fairing, Info, Kind}, http::{Cookie, Header, Status}, request::{FromRequest, Outcome}, time::OffsetDateTime, Data, Request};
use serde::{Deserialize, Serialize};
use bson::doc;
use crate::{config::Config, util::{crypto::HashedPassword, database::{Docs, Document, Id}}};

use super::error::ApiError;

#[derive(Serialize, Deserialize, Clone, Debug, Reflect, Document)]
pub struct AuthSession {
    #[serde(default, rename = "_id")]
    pub id: Id,
    pub created: String,

    #[serde(default)]
    pub user_id: Option<Id>,
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

#[derive(Serialize, Deserialize, Clone, Debug, Reflect, PartialEq, FromFormField)]
#[serde(rename_all = "snake_case")]
pub enum UserType {
    User,
    Admin
}

impl ToString for UserType {
    fn to_string(&self) -> String {
        match self {
            UserType::Admin => String::from("admin"),
            UserType::User => String::from("user")
        }
    }
}

#[derive(Serialize, Deserialize, Clone, Debug, Reflect, Document)]
pub struct AuthUser {
    #[serde(default, rename = "_id")]
    pub id: Id,
    pub kind: UserType,
    pub username: String,

    #[serde(default)]
    pub email: Option<String>,
    password: HashedPassword
}

impl AuthUser {
    pub fn new_user(username: String, email: Option<String>, password: String) -> Result<Self, Box<dyn Error + Send + Sync>> {
        let hashed_pass = HashedPassword::new(password.clone())?;

        Ok(AuthUser { kind: UserType::User, id: Id::default(), username, email, password: hashed_pass })
    }

    pub fn new_admin(username: String, email: Option<String>, password: String) -> Result<Self, Box<dyn Error + Send + Sync>> {
        let hashed_pass = HashedPassword::new(password.clone())?;

        Ok(AuthUser { kind: UserType::Admin, id: Id::default(), username, email, password: hashed_pass })
    }

    pub fn verify(&self, test: String) -> bool {
        self.password.verify(test)
    }
}

impl Into<ClientUser> for AuthUser {
    fn into(self) -> ClientUser {
        ClientUser {kind: self.kind.clone(), id: self.id.clone(), email: self.email.clone(), username: self.username.clone()}
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
                return Outcome::Forward(Status::Unauthorized);
            }

            if let Some(user) = users.get(session.clone().user_id.unwrap().to_string()).await {
                Outcome::Success(user)
            } else {
                session.user_id = None;
                let _ = sessions.save(session.clone()).await;
                return Outcome::Forward(Status::Unauthorized);
            }
        } else {
            Outcome::Error((Status::BadRequest, ApiError::Internal("Invalid session token".to_string())))
        }
    }
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ClientUser {
    pub kind: UserType,
    pub id: Id,
    pub email: Option<String>,
    pub username: String
}