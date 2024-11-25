use std::{any::TypeId, ops::{Deref, DerefMut}};

use bevy_reflect::Reflect;
use convert_case::{Case, Casing};
use couch_rs::{document::TypedCouchDocument, typed::Database, Client};
use error::ApiError;
use rocket::{http::Status, request::{FromRequest, Outcome}, Request};
use serde::{de::DeserializeOwned, Serialize};

pub mod server;
pub mod error;
pub mod auth;

pub struct Docs<T: Serialize + DeserializeOwned + Reflect + TypedCouchDocument> {
    inner: Database<T>
}

impl<T: Serialize + DeserializeOwned + Reflect + TypedCouchDocument> Docs<T> {
    pub async fn new(client: Client) -> Result<Self, ApiError> {
        let name = TypeId::of::<T>().as_reflect().reflect_short_type_path().from_case(Case::Camel).to_case(Case::Snake);
        match client.db(name.as_str()).await {
            Ok(_) => Ok(Docs {inner: Database::<T>::new(name, client.clone())}),
            Err(e) => Err(ApiError::Internal(format!("Failed to retrieve database `{name}`: {e:?}")))
        }
    }
}

#[rocket::async_trait]
impl<T: Serialize + DeserializeOwned + Reflect + TypedCouchDocument, 'r> FromRequest<'r> for Docs<T> {
    type Error = ApiError;

    async fn from_request(req: &'r Request<'_>) -> Outcome<Self, Self::Error> {
        if let Some(db) = req.rocket().state::<Client>() {
            match Docs::<T>::new(db.clone()).await {
                Ok(database) => Outcome::Success(database),
                Err(e) => Outcome::Error((Status::InternalServerError, e))
            }
        } else {
            Outcome::Error((Status::InternalServerError, ApiError::Internal(String::from("Client not in state."))))
        }
    }
}

impl<T: Serialize + DeserializeOwned + Reflect + TypedCouchDocument> Deref for Docs<T> {
    type Target = Database<T>;

    fn deref(&self) -> &Self::Target {
        &self.inner
    }
}

impl<T: Serialize + DeserializeOwned + Reflect + TypedCouchDocument> DerefMut for Docs<T> {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.inner
    }
}