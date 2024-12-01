use std::error::Error;

use bevy_reflect::Reflect;
use extism::{convert::Json, Manifest, Plugin, Wasm};
use rocket::tokio;
use serde::{Deserialize, Serialize};
use invex_sdk::{PluginConfigurationField, PluginMetadata};

use super::InResult;

#[derive(Serialize, Deserialize, Clone, Debug, Reflect)]
pub struct PluginInfo {
    #[reflect(ignore)]
    pub source: Manifest,
    #[reflect(ignore)]
    pub fields: Vec<PluginConfigurationField>,
    #[reflect(ignore)]
    pub metadata: PluginMetadata
}

impl PluginInfo {
    pub async fn from_manifest(source: Manifest) -> InResult<Self> {
        let manifest = source.clone();
        let (metadata, fields) = tokio::task::spawn_blocking(move || {
            let mut plugin = Plugin::new(&source, [], false)?;
            let metadata = plugin.call::<(), Json<PluginMetadata>>("info_metadata", ())?.into_inner();
            let fields = plugin.call::<(), Json<Vec<PluginConfigurationField>>>("info_fields", ())?.into_inner();
            Ok::<(PluginMetadata, Vec<PluginConfigurationField>), Box<dyn Error + Send + Sync>>((metadata, fields))
        }).await??;
        Ok(PluginInfo {
            source: manifest,
            fields,
            metadata
        })
    }

    pub async fn from_wasm(source: Wasm) -> InResult<Self> {
        Ok(PluginInfo::from_manifest(Manifest::new([source])).await?)
    }
}