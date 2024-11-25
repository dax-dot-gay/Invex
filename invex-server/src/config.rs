use couch_rs::{error::CouchError, Client};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct DatabaseConfig {
    pub host: String,
    pub username: String,
    pub password: String
}

impl DatabaseConfig {
    pub fn connect(&self) -> Result<Client, CouchError> {
        Client::new(&self.host, &self.username, &self.password)
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Config {
    pub database: DatabaseConfig
}