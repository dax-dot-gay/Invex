use std::fmt::Debug;

use derive_builder::Builder;
use serde::{de::DeserializeOwned, Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(untagged)]
pub enum FieldSelectOption {
    Exact(String),
    Alias { value: String, label: String },
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
        validation: Option<String>,
    },
    Number {
        #[serde(default)]
        placeholder: Option<String>,

        #[serde(default)]
        min: Option<i64>,

        #[serde(default)]
        max: Option<i64>,
    },
    Switch {},
    Select {
        options: Vec<FieldSelectOption>,

        #[serde(default)]
        multiple: bool,
    },
    TextArea {
        #[serde(default)]
        lines: Option<u64>,
    },
}

#[derive(Serialize, Deserialize, Clone, Debug, Builder)]
#[builder(setter(into, strip_option), name = "FieldBuilder")]
pub struct PluginArgument {
    pub key: String,
    pub label: String,
    pub field: FieldType,

    #[serde(default)]
    #[builder(default = "None")]
    pub icon: Option<String>,

    #[serde(default)]
    #[builder(default = "false")]
    pub required: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "snake_case", tag = "type")]
pub enum Capability {
    Grant {
        method: String,
        fields: Vec<PluginArgument>,
    },
    Revoke {
        method: String,
    },
    Action {
        label: String,
        icon: Option<String>,
        description: Option<String>,
        method: String,
        fields: Vec<PluginArgument>,
    },
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "snake_case", tag = "type")]
pub enum GrantResource<Meta> {
    Account {
        id: String,

        #[serde(default)]
        user_id: Option<String>,

        #[serde(default)]
        username: Option<String>,

        #[serde(default)]
        email: Option<String>,

        #[serde(default)]
        password: Option<String>,

        #[serde(default = "Default::default")]
        metadata: Option<Meta>,
    },
    File {
        id: String,
        data: Vec<u8>,

        #[serde(default)]
        filename: Option<String>,

        #[serde(default)]
        content_type: Option<String>,

        #[serde(default = "Default::default")]
        metadata: Option<Meta>,
    },
    Url {
        id: String,
        url: String,

        #[serde(default)]
        alias: Option<String>,

        #[serde(default)]
        label: Option<String>,

        #[serde(default = "Default::default")]
        metadata: Option<Meta>,
    },
    Generic {
        id: String,

        #[serde(default = "Default::default")]
        metadata: Option<Meta>,
    },
}

impl<Meta: Serialize + DeserializeOwned + Clone + Debug> GrantResource<Meta> {
    pub fn id(&self) -> String {
        match self {
            Self::Account { id, .. } => id,
            Self::File { id, .. } => id,
            Self::Url { id, .. } => id,
            Self::Generic { id, .. } => id,
        }
        .clone()
    }

    pub fn metadata(&self) -> Option<Meta> {
        match self {
            Self::Account { metadata, .. } => metadata,
            Self::File { metadata, .. } => metadata,
            Self::Url { metadata, .. } => metadata,
            Self::Generic { metadata, .. } => metadata,
        }
        .clone()
    }
}

#[derive(Serialize, Deserialize, Clone, Debug, Builder, Default)]
#[builder(setter(into, strip_option))]
pub struct PluginMetadata {
    pub id: String,
    pub name: String,
    pub capabilities: Vec<Capability>,
    pub version: String,

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
    pub icon: Option<String>,

    #[serde(default)]
    #[builder(default)]
    pub config: Vec<PluginArgument>
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

    pub fn with_config(&mut self, field: PluginArgument) -> &mut Self {
        if self.config.is_none() {
            self.config(Vec::new());
        }

        let mut conf = self.config.clone().unwrap();
        conf.push(field);
        conf.dedup_by(|a, b| a.key.eq_ignore_ascii_case(&b.key));
        self.config(conf);
        self
    }

    pub fn validate(&self) -> Result<(), String> {
        if let Some(capabilities) = &self.capabilities {
            let mut count_grant = 0;
            let mut count_revoke = 0;
            let mut actions = Vec::<String>::new();
            for capability in capabilities {
                match capability {
                    Capability::Grant { .. } => count_grant += 1,
                    Capability::Revoke { .. } => count_revoke += 1,
                    Capability::Action { label, .. } => {
                        if actions.contains(&label) {
                            return Err(String::from(
                                "Plugins cannot have duplicate action labels",
                            ));
                        }
                        actions.push(label.clone());
                    }
                };
            }

            if count_grant != 1 {
                return Err(String::from(
                    "Plugins must expose exactly one Grant{} capability",
                ));
            }

            if count_revoke > 1 {
                return Err(String::from(
                    "Plugins cannot expose more than one Revoke{} capability",
                ));
            }

            Ok(())
        } else {
            Err(String::from("Plugins must expose at least 1 capability"))
        }
    }
}
