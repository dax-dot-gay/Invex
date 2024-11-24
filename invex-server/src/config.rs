use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct DatabaseConfig {
    pub uri: String,
    pub database: Option<String>
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Config {
    pub database: DatabaseConfig
}