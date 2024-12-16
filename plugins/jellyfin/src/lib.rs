use extism_pdk::*;
use invex_sdk::{
    params::PluginFieldParams,
    ExpectedType,
    FieldBuilder,
    FieldSelectOption,
    FieldType,
    GrantActionBuilder,
    PluginDefinedMethodContext,
    PluginMetadata,
    PluginMetadataBuilder,
};
use models::{ JellyfinPluginConfig, LibraryReference };
use net::Connection;
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
                                Error::msg(format!("Failed to decode library list")),
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
