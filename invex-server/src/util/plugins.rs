use std::{collections::HashMap, error::Error, sync::{Arc, Mutex}};

use bevy_reflect::Reflect;
use extism::{convert::Json, Manifest, Plugin, Wasm};
use rocket::tokio;
use serde::{Deserialize, Serialize};
use invex_sdk::PluginMetadata;

use super::InResult;

pub struct PluginInstance {
    pub record: Id,
    pub metadata: PluginMetadata,
    pub manifest: Manifest,
    pub instance: Plugin
}

#[derive(Clone)]
pub struct PluginRegistry(HashMap<String, Arc<Mutex<PluginInstance>>>);

impl PluginRegistry {
    pub fn new() -> Self {
        PluginRegistry(HashMap::new())
    }


}