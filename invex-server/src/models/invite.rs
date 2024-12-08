use std::collections::HashMap;

use bevy_reflect::Reflect;
use chrono::{DateTime, Utc};
use invex_macros::Document;
use invex_sdk::GrantResource;
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

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct InviteGrant {
    pub service: Id,
    pub resources: HashMap<String, Vec<GrantResource>>
}

#[derive(Serialize, Deserialize, Clone, Debug, Reflect, Document)]
pub struct InviteUsage {
    #[serde(rename = "_id")]
    pub id: Id,

    pub user: Id,
    pub invite: (Id, String),

    #[reflect(ignore)]
    pub grants: Vec<InviteGrant>
}