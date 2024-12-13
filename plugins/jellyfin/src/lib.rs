use extism_pdk::*;
use invex_sdk::{
    FieldBuilder,
    FieldSelectOption,
    FieldType,
    NumberType,
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
                )
                .with_config(
                    FieldBuilder::minimal("test_number", "Test Number", FieldType::Number {
                        placeholder: Some(String::from("Test number")),
                        kind: NumberType::Float,
                        min: Some(-10.0),
                        max: Some(5.5),
                    })
                        .icon("icon:IconTestPipe")
                        .build()?
                )
                .with_config(
                    FieldBuilder::minimal("test_switch", "Test Switch", FieldType::Switch {})
                        .icon("icon:IconTestPipe")
                        .build()?
                )
                .with_config(
                    FieldBuilder::minimal("test_select", "Test Select", FieldType::Select {
                        options: vec![
                            FieldSelectOption::Exact(String::from("item")),
                            FieldSelectOption::Alias {
                                value: String::from("aliased_item"),
                                label: String::from("Aliased Item"),
                            }
                        ],
                        multiple: true,
                    })
                        .icon("icon:IconTestPipe")
                        .build()?
                )
                .with_config(
                    FieldBuilder::minimal("test_textarea", "Test Textarea", FieldType::TextArea {
                        lines: Some(4),
                        placeholder: Some(String::from("Put text here :)"))
                    })
                        .icon("icon:IconTestPipe")
                        .build()?
                )
                .build()?
        )
    )
}
