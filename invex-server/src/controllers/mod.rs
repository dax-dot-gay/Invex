use rocket::{Build, Rocket};

mod index;

pub fn apply_routes(rocket: Rocket<Build>) -> Rocket<Build> {
    rocket.mount("/", index::routes())
}