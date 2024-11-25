use std::ops::{Deref, DerefMut};

use bevy_reflect::{Reflect, TypeRegistration, Typed};
use convert_case::{Case, Casing};
use mongodb::{bson::{self, doc, Bson}, Collection, Database};
use rocket::{http::Status, request::{FromRequest, Outcome}, Request};
use serde::{de::DeserializeOwned, Deserialize, Serialize};
use uuid::Uuid;

use crate::models::error::ApiError;

pub trait Document: Serialize + DeserializeOwned + Reflect + Typed {
    fn id(&self) -> String;
    fn create(data: mongodb::bson::Document) -> Result<Self, mongodb::bson::de::Error> {
        let mut doc = data.clone();
        let _ = doc.insert("id", Id::default());
        bson::from_document::<Self>(doc.clone())
    }
}

pub struct Docs<T: Document> {
    inner: Collection<T>
}

impl<T: Document> Docs<T> {
    pub fn new(database: Database) -> Self {
        let name = TypeRegistration::of::<T>().type_info().type_path_table().short_path().from_case(Case::UpperCamel).to_case(Case::Snake);
        Docs {inner: database.collection(name.as_str())}
    }

    pub async fn save(&self, document: T) -> Result<Option<Bson>, mongodb::error::Error> {
        match self.inner.replace_one(doc! {"_id": document.id()}, document).upsert(true).await {
            Ok(update) => Ok(update.upserted_id),
            Err(e) => Err(e)
        }
    }

    pub async fn get<S: Into<String>>(&self, id: S) -> Option<T> {
        match self.inner.find_one(doc! {"_id": id.into()}).await {
            Ok(r) => r,
            Err(_) => None
        }
    }
}

#[rocket::async_trait]
impl<T: Document, 'r> FromRequest<'r> for Docs<T> {
    type Error = ApiError;

    async fn from_request(req: &'r Request<'_>) -> Outcome<Self, Self::Error> {
        if let Some(db) = req.rocket().state::<Database>() {
            Outcome::Success(Docs::<T>::new(db.clone()))
        } else {
            Outcome::Error((Status::InternalServerError, ApiError::Internal(String::from("Client not in state."))))
        }
    }
}

impl<T: Document> Deref for Docs<T> {
    type Target = Collection<T>;

    fn deref(&self) -> &Self::Target {
        &self.inner
    }
}

impl<T: Document> DerefMut for Docs<T> {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.inner
    }
}

#[derive(Clone, Debug, Serialize, Deserialize, Reflect)]
pub struct Id(String);

impl Default for Id {
    fn default() -> Self {
        Id(Uuid::new_v4().to_string())
    }
}

impl Deref for Id {
    type Target = String;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl Into<Bson> for Id {
    fn into(self) -> Bson {
        Bson::String(self.0)
    }
}

impl ToString for Id {
    fn to_string(&self) -> String {
        self.0.clone()
    }
}

