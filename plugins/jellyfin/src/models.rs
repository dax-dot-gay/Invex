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

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct CreateUserConfig {
    pub libraries: Vec<String>
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct CreateUserArguments {
    pub username: String,
    pub password: String
}

#[allow(dead_code)]
#[derive(Deserialize)]
#[serde(rename_all="PascalCase")]
pub struct UserPolicy {
    pub is_administrator: bool,
    pub enabled_folders: String,
    pub authentication_provider_id: String,
    pub password_reset_provider_id: String
}


#[derive(Deserialize)]
#[serde(rename_all="PascalCase")]
pub struct UserItem {
    pub name: String,
    pub id: String,
    pub policy: UserPolicy
}