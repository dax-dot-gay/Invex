use extism_pdk::*;
use invex_sdk::{
    FieldBuilder,
    FieldType,
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
                .grants(Vec::new())
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
                ).with_config(FieldBuilder::minimal("hs_name", "Jellyfin Instance Display Name", FieldType::Text {
                        placeholder: Some("My Homeserver".to_string()),
                        password: false,
                        validation: None,
                    })
                        .required(true)
                        .icon("icon:IconLabelFilled")
                        .build()?)
                .build()?
        )
    )
}
