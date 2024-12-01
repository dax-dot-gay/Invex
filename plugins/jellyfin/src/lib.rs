use extism_pdk::*;
use invex_sdk::{
    Capability, FieldBuilder, FieldType, PluginConfigurationField, PluginMetadata,
    PluginMetadataBuilder,
};

#[plugin_fn]
pub fn info_metadata() -> FnResult<Json<PluginMetadata>> {
    Ok(Json(
        PluginMetadataBuilder::default()
            .id("jellyfin")
            .author("@dax-dot-gay")
            .name("Jellyfin Integration")
            .description("Connects to Jellyfin")
            .icon("img:https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/svg/jellyfin.svg")
            .url("https://github.com/dax-dot-gay/Invex/blob/main/plugin_builds/invex_plugin_jellyfin.wasm")
            .with_capability(Capability::CreateAccount)
            .with_capability(Capability::DeleteAccount)
            .version("0.1.0")
            .build()?,
    ))
}

#[plugin_fn]
pub fn info_fields() -> FnResult<Json<Vec<PluginConfigurationField>>> {
    let mut fields: Vec<PluginConfigurationField> = Vec::new();
    fields.push(
        FieldBuilder::default()
            .key("api_key")
            .label("API Key")
            .icon("IconKeyFilled")
            .required(true)
            .width(3)
            .field(FieldType::Text {
                placeholder: Some("Jellyfin API Key".to_string()),
                password: true,
                validation: None,
            })
            .build()?,
    );
    fields.push(
        FieldBuilder::default()
            .key("instance_url")
            .label("Instance URL")
            .icon("IconServer")
            .required(true)
            .width(3)
            .field(FieldType::Text {
                placeholder: Some("Jellyfin Instance URL".to_string()),
                password: false,
                validation: None,
            })
            .build()?,
    );
    Ok(Json(fields))
}
