use std::{collections::HashMap, error::Error};

use serde::{de::DeserializeOwned, Deserialize, Serialize};
use serde_json::Value;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ParameterMap(HashMap<String, Value>);

impl ParameterMap {
    pub fn resolve<T: DeserializeOwned>(&self) -> Result<T, Box<dyn Error>> {
        let packed = serde_json::to_value(self.0.clone())?;
        Ok(serde_json::from_value::<T>(packed)?)
    }

    pub fn get<T: DeserializeOwned>(&self, key: impl AsRef<str>) -> Result<Option<T>, Box<dyn Error>> {
        if let Some(target) = self.0.get(&key.as_ref().to_string()) {
            Ok(Some(serde_json::from_value(target.clone())?))
        } else {
            Ok(None)
        }
    }
}

impl From<HashMap<String, Value>> for ParameterMap {
    fn from(value: HashMap<String, Value>) -> Self {
        Self(value)
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(untagged)]
pub enum PluginFieldParams {
    PluginConfig {},
    ServiceConfig {plugin_config: ParameterMap},
    InviteConfig {plugin_config: ParameterMap, service_config: ParameterMap}
}