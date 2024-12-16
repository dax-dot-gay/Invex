use anyhow::Error;
use serde::{Deserialize, Serialize};

use crate::FieldType;

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(tag = "method", rename_all = "snake_case")]
pub enum MethodCall {
    PluginDefinedField {field_key: String},
    ServiceDefinedField {field_key: String, config_id: String, grant_id: String},
    InviteDefinedField {field_key: String, invite_id: String, service_id: String, grant_id: String}
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(untagged)]
pub enum MethodReply {
    FieldDefinition(FieldType)
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum MethodResult {
    Success {data: MethodReply},
    Failure {code: i32, reason: String}
}

impl From<MethodReply> for MethodResult {
    fn from(value: MethodReply) -> Self {
        MethodResult::Success { data: value }
    }
}

impl From<(Error, i32)> for MethodResult {
    fn from(value: (Error, i32)) -> Self {
        MethodResult::Failure { code: value.1, reason: value.0.to_string() }
    }
}