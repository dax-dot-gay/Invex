use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct JellyfinPluginConfig {
    pub host: String,
    pub api_key: String,
    pub server_name: String
}

#[derive(Deserialize)]
pub struct LibraryReference {
    #[serde(rename = "ItemId")]
    pub id: String,

    #[serde(rename = "Name")]
    pub name: String
}