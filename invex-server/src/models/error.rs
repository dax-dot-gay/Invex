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
}