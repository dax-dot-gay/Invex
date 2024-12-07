use extism_pdk::*;
use invex_sdk::{
    Capability, PluginMetadata,
    PluginMetadataBuilder,
};

#[plugin_fn]
pub fn invex_metadata() -> FnResult<Json<PluginMetadata>> {
    Ok(Json(
        PluginMetadataBuilder::default()
            .id("jellyfin")
            .author("@dax-dot-gay")
            .name("Jellyfin Integration")
            .description("Connects to Jellyfin")
            .icon("img:https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/svg/jellyfin.svg")
            .url("https://github.com/dax-dot-gay/Invex/blob/main/plugin_builds/invex_plugin_jellyfin.wasm")
            .with_capability(Capability::Configure { method: "configure".to_string(), fields: Vec::new() })
            .with_capability(Capability::Grant { method: "configure".to_string(), fields: Vec::new() })
            .version("0.1.0")
            .build()?,
    ))
}
