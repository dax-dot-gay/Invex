use std::ops::Deref;

use rocket::{request::{FromRequest, Outcome}, Config, Request};

use crate::models::error::ApiError;

#[derive(Clone)]
pub struct Conf(Config);

#[rocket::async_trait]
impl<'r> FromRequest<'r> for Conf {
    type Error = ApiError;

    async fn from_request(request: &'r Request<'_>) -> Outcome<Self, Self::Error> {
        Outcome::Success(Self(request.rocket().config().clone()))
    }
}

impl Deref for Conf {
    type Target = Config;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}