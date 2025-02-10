use extism_pdk::*;
use invex_sdk::{
    params::GrantActionParams, ExtResult, FieldBuilder, GrantActionBuilder, GrantResource,
    HashedPassword, PluginFileData, PluginMetadata, PluginMetadataBuilder,
};

#[host_fn]
extern "ExtismHost" {
    fn fs_store(data: Json<PluginFileData>) -> ExtResult<String>;
}

#[plugin_fn]
pub fn metadata() -> FnResult<Json<PluginMetadata>> {
    Ok(Json(
        PluginMetadataBuilder::minimal("test", "Test Plugin", "0.1.0")
            .author("@dax-dot-gay")
            .description("Tests as many features as I can")
            .icon("icon:IconFlask")
            .url("https://github.com/dax-dot-gay/Invex")
            .with_config(
                FieldBuilder::minimal(
                    "example",
                    "Example Field",
                    invex_sdk::FieldType::Text {
                        placeholder: Some(String::from("An Example")),
                        password: false,
                        validation: None,
                    },
                )
                .default("BEANS!")
                .icon("icon:IconFlask")
                .required(false)
                .build()?,
            )
            .with_grant(
                GrantActionBuilder::minimal("test", "grant_test", "Test Grant")
                    .icon("icon:IconFlask")
                    .build()?,
            )
            .build()?,
    ))
}

#[plugin_fn]
pub fn grant_test(_: Json<GrantActionParams>) -> FnResult<Json<Vec<GrantResource>>> {
    let mut result: Vec<GrantResource> = Vec::new();
    result.push(GrantResource::Account {
        id: String::from("account_test"),
        user_id: Some(String::from("account_test")),
        username: Some(String::from("Test Guy")),
        email: Some(String::from("test@test.test")),
        password: Some(HashedPassword::new("testpw")),
        metadata: None,
    });

    Ok(Json(result))
}
