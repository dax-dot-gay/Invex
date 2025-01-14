use bson::doc;
use rocket::{serde::json::Json, Route};
use serde::Deserialize;

use crate::{models::{auth::{AuthSession, AuthUser, ClientUser}, error::ApiError}, util::database::Docs};

#[derive(Deserialize)]
struct LoginData {
    pub email: String,
    pub password: String
}

#[allow(dead_code)]
#[post("/login", data = "<login>")]
async fn login(session_obj: AuthSession, login: Json<LoginData>, users: Docs<AuthUser>, sessions: Docs<AuthSession>) -> Result<Json<ClientUser>, ApiError> {
    let mut session = session_obj.clone();
    if let Some(ref current_id) = session.user_id {
        if let Some(_) = users.get(current_id.to_string()).await {
            return Err(ApiError::MethodNotAllowed("Already logged in".to_string()));
        }
    }

    if let Ok(Some(user)) = users.find_one(doc! {"$or": [{"username": login.email.clone()}, {"email": login.email.clone()}]}).await {
        if user.verify(login.password.clone()) {
            session.user_id = Some(user.clone().id);
            let _ = sessions.save(session.clone()).await;
            return Ok(Json(user.clone().into()));
        } else {
            return Err(ApiError::NotFound("Unknown username or password".to_string()));
        }   
    } else {
        return Err(ApiError::NotFound("Unknown username or password".to_string()));
    }
}

#[allow(dead_code)]
#[delete("/logout")]
async fn logout(session_obj: AuthSession, _user: AuthUser, sessions: Docs<AuthSession>) -> () {
    let mut session = session_obj;
    session.user_id = None;
    let _ = sessions.save(session).await;
}

pub fn routes() -> Vec<Route> {
    routes![login, logout]
}