use serde::{Deserialize, Serialize};
use serde_repr::{Deserialize_repr, Serialize_repr};

#[derive(Serialize_repr, Deserialize_repr, PartialEq, Clone, Debug)]
#[repr(u8)]
pub enum FieldColumns {
    One = 1,
    Two = 2,
    Three = 3
}

impl Default for FieldColumns {
    fn default() -> Self {
        Self::One
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(untagged)]
pub enum FieldSelectOption {
    Exact(String),
    Alias{
        value: String,
        label: String
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum FieldType {
    Text {
        #[serde(default)]
        placeholder: Option<String>,

        #[serde(default)]
        password: bool,

        #[serde(default)]
        validation: Option<String>
    },
    Number {
        #[serde(default)]
        placeholder: Option<String>,

        #[serde(default)]
        min: Option<i64>,

        #[serde(default)]
        max: Option<i64>
    },
    Switch {},
    Select {
        options: Vec<FieldSelectOption>,

        #[serde(default)]
        multiple: bool
    },
    TextArea {
        #[serde(default)]
        lines: Option<u64>
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct PluginConfigurationField {
    pub key: String,
    pub label: String,
    pub field: FieldType,

    #[serde(default)]
    pub icon: Option<String>,

    #[serde(default)]
    pub width: FieldColumns,

    #[serde(default)]
    pub required: bool
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct PluginMetadata {
    pub id: String,
    pub name: String,

    #[serde(default)]
    pub author: Option<String>,

    #[serde(default)]
    pub description: Option<String>,

    #[serde(default)]
    pub icon: Option<String>
}
