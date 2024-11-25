use duration_string::DurationString;
use mongodb::{options::ClientOptions, Client, Database};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(untagged)]
pub enum DatabaseConnection {
    URL(String),
    Options(ClientOptions)
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct DatabaseConfig {
    pub connection: DatabaseConnection,
    pub database: String
}

impl DatabaseConfig {
    pub async fn connect(&self) -> Result<Database, mongodb::error::Error> {
        let client = match &self.connection {
            DatabaseConnection::URL(url) => Client::with_uri_str(url.clone()).await?,
            DatabaseConnection::Options(opts) => Client::with_options(opts.clone())?
        };
        Ok(client.database(&self.database))
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Config {
    pub database: DatabaseConfig,
    pub session_duration: DurationString
}