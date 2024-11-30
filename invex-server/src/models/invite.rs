use bevy_reflect::Reflect;
use chrono::{DateTime, Utc};
use invex_macros::Document;
use serde::{Deserialize, Serialize};

use crate::util::database::Id;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub enum Expiration {
    Uses(u64),
    Datetime(DateTime<Utc>)
}

#[derive(Serialize, Deserialize, Clone, Debug, Reflect, Document)]
pub struct Invite {
    #[serde(rename = "_id")]
    pub id: Id,
    pub code: String,
    pub created_by: Id,

    #[reflect(ignore)]
    pub expires: Option<Expiration>,
    pub services: Vec<Id>
}

#[derive(Serialize, Deserialize, Clone, Debug, Reflect, Document)]
pub struct InviteUsage {
    #[serde(rename = "_id")]
    pub id: Id,

    pub user: Id,
    pub invite: (Id, String),
    pub granted_services: Vec<Id>
}