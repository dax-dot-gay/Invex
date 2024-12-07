use std::{collections::HashMap, error::Error, sync::Arc};

use extism::Plugin;
use rocket::serde::json::Json;
use tokio::sync::Mutex;

use crate::models::error::ApiError;

pub mod database;
pub mod crypto;
pub mod guards;

pub type InResult<T> = Result<T, Box<dyn Error + Send + Sync>>;
pub type ApiResult<T> = Result<Json<T>, ApiError>;
pub type PluginRegistryMap = Arc<Mutex<HashMap<String, Arc<Mutex<Plugin>>>>>;