use models::{server::ServerInfo, DB};
use rocket::serde::json::Json;
use rocket_db_pools::Database;

#[macro_use] extern crate rocket;

mod controllers;
mod models;

#[get("/")]
fn index(info: ServerInfo) -> Json<ServerInfo> {
    Json(info)
}

#[launch]
fn rocket() -> _ {
    rocket::build().mount("/", routes![index]).attach(DB::init())
}
