use bson::doc;
use rocket::{serde::json::Json, Route};
use serde::{Deserialize, Serialize};

use crate::{models::{auth::{AuthSession, AuthUser, ClientUser}, error::ApiError}, util::{crypto::SecretKey, database::Docs}};

#[derive(Deserialize)]
struct LoginData {
    pub email: String,
    pub password: String
}

#[derive(Serialize)]
struct LoginResponse {
    user: ClientUser,
    client_key: SecretKey
}

#[allow(dead_code)]
#[post("/login", data = "<login>")]
async fn login(session_obj: AuthSession, login: Json<LoginData>, users: Docs<AuthUser>, sessions: Docs<AuthSession>) -> Result<Json<LoginResponse>, ApiError> {
    let mut session = session_obj.clone();
    if let Some(ref current_id) = session.user_id {
        if let Some(_) = users.get(current_id.to_string()).await {
            return Err(ApiError::MethodNotAllowed("Already logged in".to_string()));
        }
    }

    if let Ok(Some(user)) = users.find_one(doc! {"$or": [{"username": login.email.clone()}, {"email": login.email.clone()}]}).await {
        if let Some(user_key) = user.verify_and_decrypt(login.password.clone()) {
            if let Ok(client_key) = session.activate_key(user_key.clone()) {
                session.user_id = Some(user.clone().id);
                let _ = sessions.save(session.clone()).await;
                return Ok(Json(LoginResponse {user: user.clone().into(), client_key}));
            } else {
                return Err(ApiError::Internal("Failed to generate client key".to_string()));
            }
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
    session.clear_key();
    session.user_id = None;
    let _ = sessions.save(session).await;
}

pub fn routes() -> Vec<Route> {
    routes![login, logout]
}