use extism_pdk::*;
use invex_sdk::{
    params::GrantActionParams, FieldBuilder, FieldSelectOption, GrantActionBuilder,
    GrantResource, HashedPassword, PluginFileData, PluginMetadata, PluginMetadataBuilder,
};

#[host_fn]
extern "ExtismHost" {
    fn fs_store(data: Json<PluginFileData>) -> String;
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
                    "example-text",
                    "Example Field Text",
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
            .with_config(
                FieldBuilder::minimal(
                    "example-number",
                    "Example Field Number",
                    invex_sdk::FieldType::Number {
                        placeholder: None,
                        kind: invex_sdk::NumberType::Integer,
                        min: Some(-10.0),
                        max: Some(10.0),
                    },
                )
                .default(2)
                .icon("icon:IconNumber")
                .required(false)
                .build()?,
            )
            .with_config(
                FieldBuilder::minimal(
                    "example-select",
                    "Example Field Select",
                    invex_sdk::FieldType::Select {
                        options: vec![
                            FieldSelectOption::Exact(String::from("beans")),
                            FieldSelectOption::Alias {
                                value: String::from("legumes"),
                                label: String::from("LEGUMES!"),
                            },
                        ],
                        multiple: true,
                    },
                )
                .required(false)
                .icon("icon:IconBandage")
                .build()?,
            )
            .with_config(
                FieldBuilder::minimal(
                    "example-switch",
                    "Example Field Switch",
                    invex_sdk::FieldType::Switch {},
                )
                .required(false)
                .icon("icon:IconSwitch")
                .build()?,
            )
            .with_config(
                FieldBuilder::minimal(
                    "example-textarea",
                    "Example Field Textarea",
                    invex_sdk::FieldType::TextArea {
                        lines: Some(4),
                        placeholder: None,
                    },
                )
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
    let file_id = unsafe {
        fs_store(Json(PluginFileData {
            data: String::from("TEXT HERE").into_bytes(),
            filename: Some(String::from("text_file.txt")),
            content_type: String::from("text/plain"),
        }))
    };

    if let Ok(file_str) = file_id {
        let mut result: Vec<GrantResource> = Vec::new();
        result.push(GrantResource::Account {
            id: String::from("account_test"),
            user_id: Some(String::from("account_test")),
            username: Some(String::from("Test Guy")),
            email: Some(String::from("test@test.test")),
            password: Some(HashedPassword::new("testpw")),
            metadata: None,
        });

        result.push(GrantResource::File {
            id: String::from("file_test"),
            file_id: file_str,
            filename: Some(String::from("text_file.txt")),
            content_type: Some(String::from("text/plain")),
            metadata: None,
        });

        result.push(GrantResource::Url {
            id: String::from("url_test"),
            url: String::from("https://github.com/dax-dot-gay/Invex"),
            alias: None,
            label: Some(String::from("Cool Link!")),
            metadata: None,
        });

        result.push(GrantResource::Generic {
            id: String::from("generic_test"),
            name: String::from("A Generic Test"),
            metadata: None,
        });

        Ok(Json(result))
    } else {
        Err(WithReturnCode::new(Error::msg("Failed to store file"), 500))
    }
}
