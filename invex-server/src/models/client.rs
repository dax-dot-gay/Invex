use anyhow::Error;
use bson::doc;
use invex_sdk::GrantResource;
use serde::{Deserialize, Serialize};

use crate::util::database::Collections;

use super::{
    invite::{GrantResult, InviteUsage},
    plugin::PluginRegistry,
    service::{Service, ServiceGrant},
};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ClientResourceInvite {
    pub usage: String,
    pub code: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ClientResourceService {
    pub index: usize,
    pub id: String,
    pub name: String,
    pub icon: Option<String>,
    pub description: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum ClientResourcePluginGrant {
    ServiceFailure {
        code: i32,
        reason: String,
    },
    GrantFailure {
        id: String,
        code: i32,
        reason: String,
    },
    Success {
        id: String,
        resources: Vec<GrantResource>,
        plugin_id: String,
        plugin_name: String,
        plugin_icon: Option<String>,
        grant_id: String,
        grant_name: String,
        grant_icon: Option<String>,
    },
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum ClientResourceGrant {
    UnknownPlugin {
        id: String,
    },
    Plugin {
        id: String,
        plugin_id: String,
        config_id: String,
        grant_id: String,
        url: Option<String>,
        help: Option<String>,
        result: ClientResourcePluginGrant,
    },
    Attachment {
        id: String,
        file_id: String,
        display_name: Option<String>,
        help: Option<String>,
        preview: bool,
    },
    Message {
        id: String,
        title: String,
        subtitle: Option<String>,
        content: String,
    },
    InlineImage {
        id: String,
        file_id: String,
    },
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ClientResource {
    pub invite: ClientResourceInvite,
    pub service: ClientResourceService,
    pub grant: ClientResourceGrant,
}

impl ClientResource {
    pub async fn parse(
        usage: InviteUsage,
        collections: &Collections,
        plugins: &PluginRegistry,
    ) -> Result<Vec<ClientResource>, Error> {
        let invite = ClientResourceInvite {
            usage: usage.id.to_string(),
            code: usage.invite_code.clone(),
        };
        let service_ids: Vec<String> = usage.grants.iter().map(|g| g.service.to_string()).collect();
        let services = collections
            .get::<Service>()
            .query_many(doc! {"_id": {"$in": service_ids.clone()}})
            .await
            .or(Err(Error::msg("Unable to retrieve service info")))?;

        let mut result: Vec<Self> = Vec::new();
        for (id, service) in service_ids.iter().zip(services) {
            if let Some(index) = service_ids.iter().position(|i| *i == id.clone()) {
                let grant_result = usage.grants[index.clone()].resources.clone();
                let service_info = ClientResourceService {
                    index,
                    id: id.clone(),
                    name: service.name.clone(),
                    icon: service.icon.clone(),
                    description: service.description.clone(),
                };

                for (sv_grant_id, grant) in service.grants.clone() {
                    let grant_info = match grant {
                        ServiceGrant::Attachment {
                            file_id,
                            display_name,
                            help,
                            preview,
                        } => ClientResourceGrant::Attachment {
                            id: sv_grant_id.clone(),
                            file_id: file_id.to_string(),
                            display_name,
                            help,
                            preview,
                        },
                        ServiceGrant::InlineImage { file_id } => ClientResourceGrant::InlineImage {
                            id: sv_grant_id.clone(),
                            file_id: file_id.to_string(),
                        },
                        ServiceGrant::Message {
                            title,
                            subtitle,
                            content,
                        } => ClientResourceGrant::Message {
                            id: sv_grant_id.clone(),
                            title,
                            subtitle,
                            content,
                        },
                        ServiceGrant::Grant {
                            plugin_id,
                            config_id,
                            grant_id,
                            url,
                            help,
                            ..
                        } => {
                            if let Some(plugin) = plugins.get(plugin_id.to_string()).await {
                                if let Some(grant) = plugin.get_grant(grant_id.clone()) {
                                    ClientResourceGrant::Plugin {
                                        id: sv_grant_id.clone(),
                                        plugin_id: plugin_id.to_string(),
                                        config_id: config_id.to_string(),
                                        grant_id: grant_id.to_string(),
                                        url,
                                        help,
                                        result: match grant_result.clone() {
                                            GrantResult::Success { value } => value.get(&sv_grant_id).map_or(ClientResourcePluginGrant::GrantFailure { id: sv_grant_id.clone(), code: 404, reason: String::from("Unknown grant ID (may have been added post-redeem)") }, |val| {
                                                match val {
                                                    GrantResult::Success { value } => ClientResourcePluginGrant::Success { id: sv_grant_id.clone(), resources: value.clone(), plugin_id: plugin_id.to_string(), plugin_name: plugin.info().metadata.name.clone(), plugin_icon: plugin.info().metadata.icon.clone(), grant_id: grant_id.to_string(), grant_name: grant.label.clone(), grant_icon: grant.icon.clone() },
                                                    GrantResult::Error { code, reason } => ClientResourcePluginGrant::GrantFailure { id: sv_grant_id.clone(), code: code.clone(), reason: reason.clone() }
                                                }
                                            }),
                                            GrantResult::Error { code, reason } => ClientResourcePluginGrant::ServiceFailure { code, reason }
                                        }
                                    }
                                } else {
                                    ClientResourceGrant::UnknownPlugin { id: id.clone() }
                                }
                            } else {
                                ClientResourceGrant::UnknownPlugin { id: id.clone() }
                            }
                        }
                    };

                    result.push(Self {invite: invite.clone(), service: service_info.clone(), grant: grant_info.clone()});
                }
            }
        }

        Ok(result)
    }
}
