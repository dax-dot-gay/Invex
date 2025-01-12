use std::{collections::HashMap, sync::Arc};

use bson::doc;
use controllers::apply_routes;
use extism::set_log_callback;
use models::{auth::{AuthUser, SessionFairing, UserType}, plugin::{PluginRegistry, RegisteredPlugin}};
use mongodb::{Database, IndexModel};
use rocket::{fairing::AdHoc, futures::TryStreamExt, Config as RocketConfig};
use tokio::sync::Mutex;
mod config;

use config::Config;
use util::{database::{Docs, Document, Fs}, PluginRegistryMap};

#[macro_use]
extern crate rocket;

mod controllers;
mod models;
mod util;

#[launch]
async fn rocket() -> _ {
    let conf: Config = RocketConfig::figment().extract_inner("app").expect("App config");
    set_log_callback(|s| println!("{}", s.trim_end()), format!("extism={}", conf.plugin_logging)).expect("Failed to set logging callback.");
    let rocket = apply_routes(rocket::build());
    
    rocket
        .manage::<Config>(conf.clone())
        .manage::<Database>(
            conf.clone()
                .database
                .connect()
                .await
                .expect("Failed to connect to DB"),
        )
        .manage::<PluginRegistryMap>(Arc::new(Mutex::new(HashMap::new())))
        .attach(SessionFairing)
        .attach(AdHoc::on_liftoff("Setup Database", |rocket| Box::pin(async move {
            let users = Docs::<AuthUser>::new(rocket.state::<Database>().expect("Database not initialized").clone());
            let _ = users.create_index(IndexModel::builder().keys(doc! {"username": "text", "email": "text"}).build()).await.expect("Failed to create index on users");
        })))
        .attach(AdHoc::on_liftoff("Create Admin User",|rocket| Box::pin(async move {
            let users = Docs::<AuthUser>::new(rocket.state::<Database>().expect("Database not initialized").clone());
            let config = rocket.state::<Config>().expect("Config not initialized");
            if let Ok(Some(user)) = users.find_one(doc! {"email": config.admin.email.clone()}).await {
                if !matches!(user.kind, UserType::Admin) {
                    users.delete_one(doc! {"_id": user.id()}).await.expect("Failed to remove existing non-admin user");

                } else {
                    return;
                }
            }

            let new_user = AuthUser::new_admin(config.admin.username.clone(), config.admin.email.clone(), config.admin.password.clone()).expect("Invalid admin parameters.");
            users.save(new_user).await.expect("Unable to insert admin user");
        })))
        .attach(AdHoc::on_liftoff("Register Current Plugins", |rocket| Box::pin(async move {
            let plugins = rocket.state::<PluginRegistryMap>().expect("Plugins not initialized").clone();
            let plugins_db = Docs::<RegisteredPlugin>::new(rocket.state::<Database>().expect("Database not initialized").clone());
            let fs = Fs::from_db(rocket.state::<Database>().expect("Database not initialized"));
            let registry = PluginRegistry::new(plugins.clone(), plugins_db.clone(), fs.clone());
            let existing = plugins_db.find(doc! {}).await.expect("Failed to fetch from DB").try_collect::<Vec<RegisteredPlugin>>().await.expect("Failed to collect results");
            for plugin in existing {
                registry.register_existing(plugin).await.expect("Failed to register existing plugin");
            }
        })))
}
