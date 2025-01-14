use std::fmt::Display;

use serde::{ Deserialize, Serialize };

#[derive(Clone, Debug, Serialize, Deserialize, Responder)]
#[response(content_type = "json")]
pub enum ApiError {
    #[response(status = 500)] Internal(String),

    #[response(status = 400)] BadRequest(String),

    #[response(status = 401)] AuthenticationRequired(String),

    #[response(status = 405)] MethodNotAllowed(String),

    #[response(status = 404)] NotFound(String),

    #[response(status = 403)] Forbidden(String),
}

impl Display for ApiError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(format!("{self:?}").as_str())
    }
}

impl std::error::Error for ApiError {}

impl<T> From<Result<T, ApiError>> for ApiError {
    fn from(value: Result<T, ApiError>) -> Self {
        match value {
            Ok(_) => ApiError::Internal(String::from("Weird usage?")),
            Err(e) => e,
        }
    }
}

#[allow(dead_code)]
impl ApiError {
    pub fn internal(v: impl AsRef<str>) -> Self {
        Self::Internal(v.as_ref().to_string())
    }

    pub fn bad_request(v: impl AsRef<str>) -> Self {
        Self::BadRequest(v.as_ref().to_string())
    }

    pub fn authentication_required(v: impl AsRef<str>) -> Self {
        Self::AuthenticationRequired(v.as_ref().to_string())
    }

    pub fn method_not_allowed(v: impl AsRef<str>) -> Self {
        Self::MethodNotAllowed(v.as_ref().to_string())
    }

    pub fn not_found(v: impl AsRef<str>) -> Self {
        Self::NotFound(v.as_ref().to_string())
    }

    pub fn forbidden(v: impl AsRef<str>) -> Self {
        Self::Forbidden(v.as_ref().to_string())
    }

    pub fn contents(&self) -> (String, i32) {
        match self {
            Self::Internal(s) => (s.clone(), 500),
            Self::BadRequest(s) => (s.clone(), 500),
            Self::AuthenticationRequired(s) => (s.clone(), 500),
            Self::MethodNotAllowed(s) => (s.clone(), 500),
            Self::NotFound(s) => (s.clone(), 500),
            Self::Forbidden(s) => (s.clone(), 500),
        }
    }
}
