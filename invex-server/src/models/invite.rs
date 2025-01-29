use std::{collections::HashMap, error::Error, fmt::Debug};

use bevy_reflect::Reflect;
use chrono::{ DateTime, Utc };
use invex_macros::Document;
use invex_sdk::GrantResource;
use serde::{ de::DeserializeOwned, Deserialize, Serialize };

use crate::util::database::{Collections, Id};

use super::{error::ApiError, plugin::PluginRegistry};

#[derive(Serialize, Deserialize, Clone, Debug, Reflect)]
#[serde(rename_all = "snake_case")]
pub enum Expiration {
    Uses(u64),
    Datetime(i64),
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "snake_case", tag = "type", content = "value")]
pub enum ResolvedExpiration {
    Uses(u64),
    Datetime(DateTime<Utc>),
    Never,
}

#[derive(Serialize, Deserialize, Clone, Debug, Reflect, Document)]
pub struct Invite {
    #[serde(rename = "_id")]
    pub id: Id,
    pub code: String,
    pub created_by: Id,
    pub expires: Option<Expiration>,
    pub services: Vec<Id>,
}

impl Invite {
    pub fn expires(&self) -> ResolvedExpiration {
        match &self.expires {
            Some(exp) =>
                match exp {
                    Expiration::Uses(uses) => ResolvedExpiration::Uses(uses.clone()),
                    Expiration::Datetime(timestamp) =>
                        ResolvedExpiration::Datetime(
                            DateTime::from_timestamp_millis(timestamp.clone()).unwrap()
                        ),
                }
            None => ResolvedExpiration::Never,
        }
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum GrantResult<T> {
    Success {value: T},
    Error {code: i32, reason: String}
}

impl<T: Serialize + DeserializeOwned + Clone + Debug> From<Result<T, ApiError>> for GrantResult<T> {
    fn from(value: Result<T, ApiError>) -> Self {
        match value {
            Ok(v) => Self::Success { value: v },
            Err(e) => {
                let (reason, code) = e.contents();
                Self::Error { code, reason }
            }
        }
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct InviteGrant {
    pub service: Id,
    pub resources: GrantResult<HashMap<String, GrantResult<Vec<GrantResource>>>>,
}

#[derive(Serialize, Deserialize, Clone, Debug, Reflect, Document)]
pub struct InviteUsage {
    #[serde(rename = "_id")]
    pub id: Id,

    pub user: Id,
    pub invite_id: Id,
    pub invite_code: String,

    #[reflect(ignore)]
    pub grants: Vec<InviteGrant>,
}

impl InviteUsage {
    pub async fn hydrate(&self, collections: Collections, plugins: PluginRegistry) -> Result<HydratedUsage, Box<dyn Error>> {
        
    }
}

impl InviteGrant {
    pub async fn hydrate(&self, collections: Collections, plugins: PluginRegistry) -> Result<HydratedGrant, Box<dyn Error>> {

    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct HydratedResource {
    pub id: String,
    pub grant_id: String,
    pub grant_label: String,
    pub grant_description: Option<String>,
    pub grant_icon: Option<String>,
    pub plugin_id: String,
    pub plugin_name: String,
    pub plugin_icon: Option<String>,
    pub resource: GrantResource
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct HydratedGrant {
    pub id: String,
    pub service_name: String,
    pub service_icon: Option<String>,
    pub service_description: Option<String>,
    pub resources: GrantResult<HashMap<String, GrantResult<Vec<HydratedResource>>>>
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct HydratedUsage {
    pub id: String,
    pub code: String,
    pub grants: Vec<HydratedGrant>
}
