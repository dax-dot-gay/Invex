use std::ops::{Deref, DerefMut};

use bevy_reflect::{Reflect, TypeRegistration, Typed};
use convert_case::{Case, Casing};
use error::ApiError;
use rocket::{http::Status, request::{FromRequest, Outcome}, Request};
use serde::{de::DeserializeOwned, Serialize};

pub mod server;
pub mod error;
pub mod auth;