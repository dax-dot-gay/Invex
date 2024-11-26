use bson::doc;
use models::{auth::{AuthUser, SessionFairing}, server::ServerInfo};
use mongodb::Database;
use rocket::{fairing::AdHoc, serde::json::Json};
mod config;

use config::Config;
use util::database::{Docs, Document};

#[macro_use]
extern crate rocket;

mod controllers;
mod models;
mod util;

#[get("/")]
fn index(info: ServerInfo) -> Json<ServerInfo> {
    Json(info)
}

#[launch]
async fn rocket() -> _ {
    let rocket = rocket::build().mount("/", routes![index]);
    let conf: Config = rocket.figment().extract_inner("app").expect("App config");
    rocket
        .manage::<Config>(conf.clone())
        .manage::<Database>(
            conf.clone()
                .database
                .connect()
                .await
                .expect("Failed to connect to DB"),
        )
        .attach(SessionFairing)
        .attach(AdHoc::on_liftoff("Create Admin User",|rocket| Box::pin(async move {
            let users = Docs::<AuthUser>::new(rocket.state::<Database>().expect("Database not initialized").clone());
            let config = rocket.state::<Config>().expect("Config not initialized");
            if let Ok(Some(user)) = users.find_one(doc! {"username": config.admin.username.clone()}).await {
                if !user.is_admin() {
                    users.delete_one(doc! {"_id": user.id()}).await.expect("Failed to remove existing non-admin user");

                } else {
                    return;
                }
            }

            let new_user = AuthUser::new_admin(config.admin.username.clone(), config.admin.password.clone()).expect("Invalid admin parameters.");
            users.save(new_user).await.expect("Unable to insert admin user");
        })))
}
