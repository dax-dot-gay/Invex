use chrono::{DateTime, Utc};
use rocket::{
    request::{FromRequest, Outcome},
    Request,
};
use serde::{Deserialize, Serialize};

use super::{auth::ClientUser, error::ApiError};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ServerInfo {
    pub profile: String,
    pub request_time: DateTime<Utc>,
    pub session: String,
    pub user: Option<ClientUser>
}
