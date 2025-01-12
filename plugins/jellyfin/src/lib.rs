use extism_pdk::*;
use invex_sdk::{
    params::{GrantActionParams, PluginFieldParams}, ExpectedType, FieldBuilder, FieldSelectOption, FieldType, GrantActionBuilder, GrantResource, PluginDefinedMethodContext, PluginMetadata, PluginMetadataBuilder
};
use models::{ CreateUserArguments, CreateUserConfig, JellyfinPluginConfig, LibraryReference, UserItem };
use net::Connection;
use serde_json::json;
mod net;
mod models;

#[plugin_fn]
pub fn metadata() -> FnResult<Json<PluginMetadata>> {
    Ok(
        Json(
            PluginMetadataBuilder::minimal("jellyfin", "Jellyfin Integration", "0.1.1")
                .author("@dax-dot-gay")
                .description("Connects to Jellyfin")
                .icon("img:https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/svg/jellyfin.svg")
                .url(
                    "https://github.com/dax-dot-gay/Invex/blob/main/plugin_builds/invex_plugin_jellyfin.wasm"
                )
                .with_config(
                    FieldBuilder::minimal("host", "Jellyfin Instance URL", FieldType::Text {
                        placeholder: Some("https://jellyfin.your.server".to_string()),
                        password: false,
                        validation: None,
                    })
                        .required(true)
                        .icon("icon:IconServer")
                        .build()?
                )
                .with_config(
                    FieldBuilder::minimal("api_key", "API Key", FieldType::Text {
                        placeholder: Some("API Key".to_string()),
                        password: true,
                        validation: None,
                    })
                        .required(true)
                        .icon("icon:IconKeyFilled")
                        .build()?
                )
                .with_config(
                    FieldBuilder::minimal(
                        "server_name",
                        "Jellyfin Instance Display Name",
                        FieldType::Text {
                            placeholder: Some("My Homeserver".to_string()),
                            password: false,
                            validation: None,
                        }
                    )
                        .required(true)
                        .icon("icon:IconLabelFilled")
                        .build()?
                )
                .with_grant(
                    GrantActionBuilder::minimal(
                        "create_user",
                        "grant_create_user",
                        "Create Normal User"
                    )
                        .description("Adds a normal (non-admin) user to the instance.")
                        .icon("icon:IconUserPlus")
                        .with_option(
                            FieldBuilder::minimal(
                                "libraries",
                                "Library Access",
                                FieldType::PluginDefined {
                                    method: String::from("util_get_libraries"),
                                    context: PluginDefinedMethodContext::Service,
                                    expected_type: ExpectedType::StringArray,
                                }
                            )
                                .required(true)
                                .icon("icon:IconLibraryPhoto")
                                .build()?
                        )
                        .with_argument(
                            FieldBuilder::minimal("username", "Username", FieldType::Text {
                                placeholder: Some(String::from("Blackbeard")),
                                password: false,
                                validation: None,
                            })
                                .required(true)
                                .icon("icon:IconUser")
                                .build()?
                        )
                        .with_argument(
                            FieldBuilder::minimal("password", "Password", FieldType::Text {
                                placeholder: Some(String::from("super-secret")),
                                password: true,
                                validation: None,
                            })
                                .required(true)
                                .icon("icon:IconLockFilled")
                                .build()?
                        )
                        .revoke_method("revoke_create_user")
                        .build()?
                )
                .build()?
        )
    )
}

#[plugin_fn]
pub fn util_get_libraries(params: Json<PluginFieldParams>) -> FnResult<Json<FieldType>> {
    let param_item = params.into_inner();
    if let PluginFieldParams::ServiceConfig { plugin_config } = param_item.clone() {
        if let Ok(config) = plugin_config.resolve::<JellyfinPluginConfig>() {
            let connection: Connection = config.into();
            match connection.get("/Library/VirtualFolders") {
                Ok(response) => {
                    if let Ok(libraries) = response.json::<Vec<LibraryReference>>() {
                        Ok(
                            Json(FieldType::Select {
                                options: libraries
                                    .iter()
                                    .map(|l| FieldSelectOption::Alias {
                                        value: l.id.clone(),
                                        label: l.name.clone(),
                                    })
                                    .collect(),
                                multiple: true,
                            })
                        )
                    } else {
                        Err(
                            WithReturnCode(
                                Error::msg(format!("Failed to decode library list: {}", response.status_code())),
                                422
                            )
                        )
                    }
                }
                Err(e) =>
                    Err(
                        WithReturnCode(Error::msg(format!("Failed to list libraries: {e:?}")), 500)
                    ),
            }
        } else {
            Err(WithReturnCode(Error::msg("Invalid plugin config"), 422))
        }
    } else {
        Err(WithReturnCode(Error::msg(format!("Field used in inappropriate context: {param_item:?}")), 405))
    }
}

#[plugin_fn]
pub fn grant_create_user(params: Json<GrantActionParams>) -> FnResult<Json<Vec<GrantResource>>> {
    let action_params = params.into_inner();
    let plugin_config = action_params.plugin_config.resolve::<JellyfinPluginConfig>().or(Err(WithReturnCode(Error::msg("Invalid plugin config"), 422)))?;
    let service_config = action_params.service_config.resolve::<CreateUserConfig>().or(Err(WithReturnCode(Error::msg("Invalid service config"), 422)))?;
    let user_arguments = action_params.user_arguments.resolve::<CreateUserArguments>().or(Err(WithReturnCode(Error::msg("Invalid user arguments"), 422)))?;
    let dry_run = action_params.dry_run;

    let connection: Connection = plugin_config.into();
    match connection.get("/Users") {
        Ok(response) => {
            match response.json::<Vec<UserItem>>().and_then(|v| Ok(v.iter().map(|i| i.name.clone()).collect::<Vec<String>>())) {
                Ok(existing) =>  {
                if existing.contains(&user_arguments.username) {
                    return Err(WithReturnCode(Error::msg("Desired username already exists"), 405));
                }

                if dry_run {
                    Ok(Json(vec![GrantResource::Account { id: String::from("dry_run"), user_id: None, username: Some(user_arguments.username.clone()), email: None, password: Some(user_arguments.password.clone()), metadata: None }]))
                } else {
                    match connection.post("/Users/New", Some(json!({"Name": user_arguments.username.clone(), "Password": user_arguments.password.clone()}))) {
                        Ok(response) => {
                            if let Ok(created) = response.json::<UserItem>() {
                                match connection.post(format!("/Users/{}/Policy", created.id.clone()), Some(json!({
                                    "AuthenticationProviderId": created.policy.authentication_provider_id.clone(),
                                    "PasswordResetProviderId": created.policy.password_reset_provider_id.clone(),
                                    "EnabledFolders": service_config.libraries.clone()
                                }))) {
                                    Ok(_) => Ok(Json(vec![GrantResource::Account { id: created.id.clone(), user_id: Some(created.id.clone()), username: Some(created.name.clone()), email: None, password: Some(user_arguments.password.clone()), metadata: None }])),
                                    Err(e) => Err(WithReturnCode(Error::msg(format!("Failed to add user to libraries: {e:?}")), 500))
                                }
                            } else {
                                Err(WithReturnCode(Error::msg("Failed to parse created user"), 500))
                            }
                        }, 
                        Err(e) => Err(WithReturnCode(Error::msg(format!("Failed to create user: {e:?}")), 500))
                    }
                }
            },
            Err(e) => Err(WithReturnCode(Error::msg(format!("Failed to parse list of existing users: {e:?}")), 500))
            }
        },
        Err(e) => Err(WithReturnCode(Error::msg(format!("Failed to retrieve list of existing users: {e:?}")), 500))
    }
}
