use models::server::ServerInfo;
use rocket::serde::json::Json;
mod config;

use config::Config;

#[macro_use] extern crate rocket;

mod controllers;
mod models;

#[get("/")]
fn index(info: ServerInfo) -> Json<ServerInfo> {
    Json(info)
}

#[launch]
async fn rocket() -> _ {
    let rocket = rocket::build().mount("/", routes![index]);
    let conf: Config = rocket.figment().extract_inner("app").expect("App config");
    rocket.manage::<Config>(conf.clone())
}
