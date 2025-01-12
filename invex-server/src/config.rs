use std::fmt::Display;

use duration_string::DurationString;
use mongodb::{options::ClientOptions, Client, Database};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "snake_case")]
pub enum LogLevel {
    Trace,
    Debug,
    Info,
    Warn,
    Error
}

impl Display for LogLevel {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(match self {
            LogLevel::Trace => "trace",
            LogLevel::Debug => "debug",
            LogLevel::Info => "info",
            LogLevel::Warn => "warn",
            LogLevel::Error => "error"
        })
    }
}

impl Default for LogLevel {
    fn default() -> Self {
        Self::Info
    }
}

#[derive(Deserialize, Clone, Debug)]
#[serde(untagged)]
pub enum DatabaseConnection {
    URL(String),
    Options(ClientOptions)
}

#[derive(Deserialize, Clone, Debug)]
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
pub struct CustomizationConfig {
    #[serde(default)]
    pub server_name: Option<String>,

    #[serde(default)]
    pub server_welcome: Option<String>
}

impl Default for CustomizationConfig {
    fn default() -> Self {
        CustomizationConfig {
            server_name: None,
            server_welcome: None
        }
    }
}

#[derive(Deserialize, Clone, Debug)]
pub struct AdminConfig {
    pub username: String,

    #[serde(default)]
    pub email: Option<String>,
    pub password: String
}

#[derive(Deserialize, Clone, Debug)]
pub struct Config {
    pub database: DatabaseConfig,
    pub admin: AdminConfig,
    pub session_duration: DurationString,

    #[serde(default)]
    pub plugin_logging: LogLevel,

    #[serde(default)]
    pub customization: CustomizationConfig
}