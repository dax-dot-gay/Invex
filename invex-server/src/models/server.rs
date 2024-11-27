use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::config::CustomizationConfig;

use super::auth::ClientUser;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ServerInfo {
    pub profile: String,
    pub request_time: DateTime<Utc>,
    pub session: String,
    pub user: Option<ClientUser>,
    pub customization: CustomizationConfig
}
