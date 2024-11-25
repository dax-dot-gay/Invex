use bevy_reflect::Reflect;
use chrono::{DateTime, Utc};
use couch_rs::{document::TypedCouchDocument, types::document::DocumentId, CouchDocument};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Serialize, Deserialize, Clone, Debug, Reflect, CouchDocument)]
pub struct AuthSession {
    #[serde(default = "crate::util::new_id")]
    pub _id: DocumentId,
    #[serde(skip_serializing_if = "String::is_empty")]
    pub _rev: String,
    #[serde(default = "Utc::now")]
    #[reflect(ignore)]
    pub created: DateTime<Utc>,
    pub user_id: Option<Uuid>
}

#[derive(Serialize, Deserialize, Clone, Debug, Reflect, CouchDocument)]
pub struct AuthUser {
    #[serde(default = "crate::util::new_id")]
    pub _id: DocumentId,
    #[serde(skip_serializing_if = "String::is_empty")]
    pub _rev: String,
    pub username: String,
    pub email: String,
    pub password: String
}