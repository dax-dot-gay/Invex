use std::collections::HashMap;

use bevy_reflect::Reflect;
use invex_macros::Document;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use crate::util::database::Id;

#[derive(Serialize, Deserialize, Clone, Debug, Reflect)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum ServiceGrant {
    Grant {
        plugin_id: Id,
        config_id: Id,
        grant_id: String,

        #[reflect(ignore)]
        options: Value,
        url: Option<String>,
        help: Option<String>
    },
    Attachment {
        file_id: Id,
        display_name: Option<String>,
        help: Option<String>,
        preview: bool
    },
    Message {
        title: String,
        subtitle: Option<String>,
        content: String
    },
    InlineImage {
        file_id: Id
    }
}

#[derive(Serialize, Deserialize, Clone, Debug, Reflect, Document)]
pub struct Service {
    #[serde(rename = "_id")]
    pub id: Id,
    pub name: String,
    pub icon: Option<String>,
    pub description: Option<String>,
    pub grants: HashMap<String, ServiceGrant>
}

impl Service {
    pub fn create(name: String, icon: Option<String>, description: Option<String>) -> Self {
        Service {
            id: Id::default(),
            name,
            icon,
            description,
            grants: HashMap::new()
        }
    }

    pub fn add_grant(&mut self, grant: ServiceGrant) {
        self.grants.insert(Id::default().to_string(), grant.clone());
    }

    pub fn modify_grant<T: AsRef<str>>(&mut self, id: T, grant: ServiceGrant) {
        self.grants.insert(id.as_ref().to_string(), grant.clone());
    }

    pub fn get_grant<T: AsRef<str>>(&self, id: T) -> Option<ServiceGrant> {
        self.grants.get(&id.as_ref().to_string()).and_then(|v| Some(v.clone()))
    }

    pub fn remove_grant<T: AsRef<str>>(&mut self, id: T) {
        self.grants.remove(&id.as_ref().to_string());
    }
}