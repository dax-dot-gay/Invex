use bevy_reflect::Reflect;
use mongodb::Client;
use serde::{de::DeserializeOwned, Serialize};

use crate::models::error::ApiError;

pub struct Docs<T: Serialize + DeserializeOwned + Reflect> {
    inner: Database<T>
}

impl<T: Serialize + DeserializeOwned + Reflect> Docs<T> {
    pub async fn new(client: Client) -> Result<Self, ApiError> {
        let name = TypeRegistration::of::<T>().type_info().type_path_table().short_path().from_case(Case::UpperCamel).to_case(Case::Snake);
        match client.db(name.as_str()).await {
            Ok(_) => Ok(Docs {inner: Database::<T>::new(name, client.clone())}),
            Err(e) => Err(ApiError::Internal(format!("Failed to retrieve database `{name}`: {e:?}")))
        }
    }
}

#[rocket::async_trait]
impl<T: Serialize + DeserializeOwned + Reflect, 'r> FromRequest<'r> for Docs<T> {
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

impl<T: Serialize + DeserializeOwned + Reflect> Deref for Docs<T> {
    type Target = Database<T>;

    fn deref(&self) -> &Self::Target {
        &self.inner
    }
}

impl<T: Serialize + DeserializeOwned + Reflect> DerefMut for Docs<T> {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.inner
    }
}