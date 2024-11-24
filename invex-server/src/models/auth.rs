use chrono::{DateTime, Utc};
use rocket::{fairing::{Fairing, Info, Kind}, outcome::Outcome, Data, Request};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use super::DB;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Session {
    pub id: Uuid,
    pub creation: DateTime<Utc>,
    pub user: Option<Uuid>
}

pub struct Sessions;

#[rocket::async_trait]
impl Fairing for Sessions {
    fn info(&self) -> Info {
        Info {
            name: "Session cookie management",
            kind: Kind::Request | Kind::Response
        }
    }

    async fn on_request(&self, request: &mut Request<'_>, _: &mut Data<'_>) {
        if let Outcome::Success(db) = request.guard::<&DB>().await {

        } else {
            panic!("Database is not set");
        }
        
    }
}