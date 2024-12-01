use std::fmt::Display;

use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize, Responder)]
#[response(content_type = "json")]
pub enum ApiError {
    #[response(status = 500)]
    Internal(String),

    #[response(status = 400)]
    BadRequest(String),

    #[response(status = 401)]
    AuthenticationRequired(String),

    #[response(status = 405)]
    MethodNotAllowed(String),

    #[response(status = 404)]
    NotFound(String),

    #[response(status = 403)]
    Forbidden(String),
}

impl Display for ApiError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(format!("{self:?}").as_str())
    }
}

impl std::error::Error for ApiError {}