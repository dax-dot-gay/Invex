use derive_builder::Builder;
use serde::{Deserialize, Serialize};
use serde_repr::{Deserialize_repr, Serialize_repr};

#[derive(Serialize_repr, Deserialize_repr, PartialEq, Clone, Debug)]
#[repr(u8)]
pub enum FieldColumns {
    One = 1,
    Two = 2,
    Three = 3
}

impl From<u8> for FieldColumns {
    fn from(value: u8) -> Self {
        match value {
            1 => Self::One,
            2 => Self::Two,
            3 => Self::Three,
            _ => Self::One
        }
    }
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

#[derive(Serialize, Deserialize, Clone, Debug, Builder)]
#[builder(setter(into, strip_option), name = "FieldBuilder")]
pub struct PluginConfigurationField {
    pub key: String,
    pub label: String,
    pub field: FieldType,

    #[serde(default)]
    #[builder(default = "None")]
    pub icon: Option<String>,

    #[serde(default)]
    #[builder(default = "FieldColumns::default()")]
    pub width: FieldColumns,

    #[serde(default)]
    #[builder(default = "false")]
    pub required: bool
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "snake_case")]
pub enum Capability {
    CreateAccount,
    DeleteAccount,
    ChangeOwnPassword,
    DeleteOwnAccount
}

#[derive(Serialize, Deserialize, Clone, Debug, Builder)]
#[builder(setter(into, strip_option))]
pub struct PluginMetadata {
    pub id: String,
    pub name: String,
    pub capabilities: Vec<Capability>,

    #[serde(default)]
    #[builder(default = "None")]
    pub author: Option<String>,

    #[serde(default)]
    #[builder(default = "None")]
    pub url: Option<String>,

    #[serde(default)]
    #[builder(default = "None")]
    pub description: Option<String>,

    #[serde(default)]
    #[builder(default = "None")]
    pub icon: Option<String>
}

impl PluginMetadataBuilder {
    pub fn with_capability(&mut self, capability: Capability) -> &mut Self {
        if self.capabilities.is_none() {
            self.capabilities(Vec::new());
        }

        let mut cap = self.capabilities.clone().unwrap();
        cap.push(capability);
        self.capabilities(cap);
        self
    }
}
