use extism_pdk::*;
use invex_sdk::{
    PluginMetadata, PluginMetadataBuilder
};

#[plugin_fn]
pub fn metadata() -> FnResult<Json<PluginMetadata>> {
    Ok(Json(
        PluginMetadataBuilder::default()
            .id("jellyfin")
            .author("@dax-dot-gay")
            .name("Jellyfin Integration")
            .description("Connects to Jellyfin")
            .icon("img:https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/svg/jellyfin.svg")
            .url("https://github.com/dax-dot-gay/Invex/blob/main/plugin_builds/invex_plugin_jellyfin.wasm")
            .version("0.1.1")
            .grants(Vec::new())
            .build()?,
    ))
}
