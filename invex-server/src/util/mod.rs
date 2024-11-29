use std::error::Error;

use rocket::serde::json::Json;

use crate::models::error::ApiError;

pub mod database;
pub mod crypto;
pub mod guards;

pub type InResult<T> = Result<T, Box<dyn Error + Send + Sync>>;
pub type ApiResult<T> = Result<Json<T>, ApiError>;