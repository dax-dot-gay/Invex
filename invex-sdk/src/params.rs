use std::collections::HashMap;

use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ConfigFieldParams;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ServiceFieldParams {
    pub plugin_options: HashMap<String, Value>
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct InviteFieldParams {
    pub plugin_options: HashMap<String, Value>,
    pub service_options: HashMap<String, Value>
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub enum PluginParams {
    ConfigField(ConfigFieldParams),
    ServiceField(ServiceFieldParams),
    InviteField(InviteFieldParams)
}