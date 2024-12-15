use extism_pdk::*;
use invex_sdk::{
    ExpectedType,
    FieldBuilder,
    FieldType,
    GrantActionBuilder,
    PluginDefinedMethodContext,
    PluginMetadata,
    PluginMetadataBuilder,
};

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
                        "hs_name",
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
