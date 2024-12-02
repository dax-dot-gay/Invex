use bevy_reflect::Reflect;
use invex_macros::Document;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use crate::util::database::Id;

#[derive(Serialize, Deserialize, Clone, Debug, Reflect)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum ServiceGrant {
    Account {
        plugin_id: Id,

        #[reflect(ignore)]
        options: Value
    },
    File {
        file_id: Id,
        inline: bool
    }
}

#[derive(Serialize, Deserialize, Clone, Debug, Reflect, Document)]
pub struct Service {
    #[serde(rename = "_id")]
    pub id: Id,
    pub name: String,
    pub icon: Option<String>,
    pub help_text: Option<String>,
    pub grants: Vec<ServiceGrant>
}