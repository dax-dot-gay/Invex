use rocket::{Build, Rocket};

mod auth;
mod index;
mod users;
mod plugins;
mod services;

pub fn apply_routes(rocket: Rocket<Build>) -> Rocket<Build> {
    rocket
        .mount("/", index::routes())
        .mount("/", auth::routes())
        .mount("/users/", users::routes())
        .mount("/plugins/", plugins::routes())
        .mount("/services/", services::routes())
}
