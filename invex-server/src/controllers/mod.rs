use rocket::{Build, Rocket};

mod index;
mod auth;

pub fn apply_routes(rocket: Rocket<Build>) -> Rocket<Build> {
    rocket.mount("/", index::routes()).mount("/", auth::routes())
}