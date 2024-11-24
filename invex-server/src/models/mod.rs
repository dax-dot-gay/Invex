use rocket_db_pools::{mongodb, Database};

pub mod server;
pub mod error;

#[derive(Database)]
#[database("invex")]
pub struct DB(mongodb::Client);