use sea_orm::{ConnectionTrait, Database, DatabaseConnection, DbBackend, DbErr, Statement};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct DatabaseConfig {
    pub uri: String,
    pub database: Option<String>
}

impl DatabaseConfig {
    pub async fn connect(&self) -> Result<DatabaseConnection, DbErr> {
        let db = Database::connect(self.uri.clone()).await?;
        let db = match db.get_database_backend() {
            DbBackend::Postgres => {
                db.execute(Statement::from_string(db.get_database_backend(), format!("CREATE DATABASE IF NOT EXISTS `{}`;", self.database.clone().expect("Database name is required to use Postgres")))).await?;
                Database::connect(format!("{}/{}", self.uri, self.database.clone().expect("Database name is required to use Postgres"))).await?
            },
            DbBackend::Sqlite => db,
            _ => panic!("Unsupported DB protocol!")
        };
        Ok(db)
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Config {
    pub database: DatabaseConfig
}