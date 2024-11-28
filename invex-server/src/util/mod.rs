use std::error::Error;

pub mod database;
pub mod crypto;
pub mod guards;

pub type InResult<T> = Result<T, Box<dyn Error + Send + Sync>>;