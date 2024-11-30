use std::path::Path;

use bevy_reflect::Reflect;
use extism::Wasm;
use invex_macros::Document;
use serde::{Deserialize, Serialize};
use crate::util::database::Id;

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(tag = "type")]
pub enum ServiceInfo {
    Plugin {
        source: Wasm
    },
    Information {
        #[serde(default)]
        content: Option<String>,

        #[serde(default)]
        urls: Option<Vec<String>>
    }
}

#[derive(Serialize, Deserialize, Clone, Debug, Reflect, Document)]
pub struct Service {
    #[serde(rename = "_id")]
    pub id: Id,
    pub name: String,
    pub details: Option<String>
}