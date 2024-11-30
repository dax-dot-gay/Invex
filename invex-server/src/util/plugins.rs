use extism::Wasm;
use serde::{Deserialize, Serialize};

pub struct PluginConfigurationField {
    pub key: String,
    
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct PluginInfo {
    pub source: Wasm
}