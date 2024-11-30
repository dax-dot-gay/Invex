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
            .icon("IconDeviceTv")
            .with_capability(Capability::CreateAccount)
            .with_capability(Capability::DeleteAccount)
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
