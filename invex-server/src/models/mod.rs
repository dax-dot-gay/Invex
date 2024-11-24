use rocket_db_pools::{mongodb, Database};

pub mod server;
pub mod error;
pub mod auth;

#[derive(Database)]
#[database("invex")]
pub struct DB(mongodb::Client);