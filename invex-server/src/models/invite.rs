use std::collections::HashMap;

use bevy_reflect::Reflect;
use chrono::{ DateTime, Utc };
use invex_macros::Document;
use invex_sdk::GrantResource;
use serde::{ Deserialize, Serialize };

use crate::util::database::Id;

#[derive(Serialize, Deserialize, Clone, Debug, Reflect)]
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
                            DateTime::from_timestamp_nanos(timestamp.clone())
                        ),
                }
            None => ResolvedExpiration::Never,
        }
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct InviteGrant {
    pub service: Id,
    pub resources: HashMap<String, Vec<GrantResource>>,
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
