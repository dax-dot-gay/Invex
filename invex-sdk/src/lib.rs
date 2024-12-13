use std::fmt::Debug;

use derive_builder::Builder;
use serde::{de::DeserializeOwned, Deserialize, Serialize};
use serde_json::Value;

pub mod params;

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(untagged)]
pub enum FieldSelectOption {
    Exact(String),
    Alias { value: String, label: String },
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "snake_case")]
pub enum PluginDefinedMethodContext {
    Plugin,
    Service,
    Invite,
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
    PluginDefined {
        method: String,
        context: PluginDefinedMethodContext,
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

    #[serde(default)]
    #[builder(default = "None")]
    pub default: Option<Value>
}

impl FieldBuilder {
    pub fn minimal<Key: AsRef<str>, Label: AsRef<str>>(key: Key, label: Label, field: FieldType) -> Self {
        Self {
            key: Some(key.as_ref().to_string()),
            label: Some(label.as_ref().to_string()),
            field: Some(field),
            icon: None,
            required: Some(false),
            default: None
        }
    }
}

#[derive(Serialize, Deserialize, Clone, Debug, Builder)]
#[builder(setter(into, strip_option))]
pub struct GrantAction {
    pub key: String,
    pub method: String,
    pub label: String,

    #[serde(default)]
    #[builder(default = "Vec::new()")]
    pub options: Vec<PluginArgument>,

    #[serde(default)]
    #[builder(default = "Vec::new()")]
    pub arguments: Vec<PluginArgument>,

    #[serde(default)]
    #[builder(default = "None")]
    pub description: Option<String>,

    #[serde(default)]
    #[builder(default = "None")]
    pub icon: Option<String>,

    #[serde(default)]
    #[builder(default = "None")]
    pub revoke_method: Option<String>,
}

impl GrantActionBuilder {
    pub fn minimal<Key: AsRef<str>, Method: AsRef<str>, Label: AsRef<str>>(key: Key, method: Method, label: Label) -> Self {
        Self {
            key: Some(key.as_ref().to_string()),
            method: Some(method.as_ref().to_string()),
            label: Some(label.as_ref().to_string()),
            options: None,
            arguments: None,
            description: None,
            icon: None,
            revoke_method: None
        }
    }

    pub fn with_argument(&mut self, field: PluginArgument) -> &mut Self {
        if self.arguments.is_none() {
            self.arguments(Vec::new());
        }

        let mut args = self.arguments.clone().unwrap();
        args.push(field);
        args.dedup_by(|a, b| a.key.eq_ignore_ascii_case(&b.key));
        self.arguments(args);
        self
    }

    pub fn with_option(&mut self, field: PluginArgument) -> &mut Self {
        if self.options.is_none() {
            self.options(Vec::new());
        }

        let mut args = self.options.clone().unwrap();
        args.push(field);
        args.dedup_by(|a, b| a.key.eq_ignore_ascii_case(&b.key));
        self.options(args);
        self
    }

    pub fn validate(&self) -> Result<(), String> {
        for entry in self.options.clone().unwrap_or_default() {
            if let FieldType::PluginDefined { context, method } = entry.field {
                if !matches!(context, PluginDefinedMethodContext::Service) {
                    return Err(format!("Plugin-defined method {method} used in incorrect context (must be in Service context)"));
                }
            }
        }
        for entry in self.arguments.clone().unwrap_or_default() {
            if let FieldType::PluginDefined { context, method } = entry.field {
                if !matches!(context, PluginDefinedMethodContext::Invite) {
                    return Err(format!("Plugin-defined method {method} used in incorrect context (must be in Invite context)"));
                }
            }
        }
        Ok(())
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "snake_case", tag = "type")]
pub enum GrantResource {
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
        metadata: Option<Value>,
    },
    File {
        id: String,
        data: Vec<u8>,

        #[serde(default)]
        filename: Option<String>,

        #[serde(default)]
        content_type: Option<String>,

        #[serde(default = "Default::default")]
        metadata: Option<Value>,
    },
    Url {
        id: String,
        url: String,

        #[serde(default)]
        alias: Option<String>,

        #[serde(default)]
        label: Option<String>,

        #[serde(default = "Default::default")]
        metadata: Option<Value>,
    },
    Generic {
        id: String,

        #[serde(default = "Default::default")]
        metadata: Option<Value>,
    },
    Action {
        id: String,

        #[serde(default = "Default::default")]
        metadata: Option<Value>,

        method: String,
        label: String,

        #[serde(default)]
        arguments: Vec<PluginArgument>,

        #[serde(default)]
        description: Option<String>,

        #[serde(default)]
        icon: Option<String>,
    },
}

impl GrantResource {
    pub fn id(&self) -> String {
        match self {
            Self::Account { id, .. } => id,
            Self::File { id, .. } => id,
            Self::Url { id, .. } => id,
            Self::Generic { id, .. } => id,
            Self::Action { id, .. } => id,
        }
        .clone()
    }

    pub fn metadata<Meta: DeserializeOwned>(&self) -> Option<Meta> {
        let serialized = match self {
            Self::Account { metadata, .. } => metadata,
            Self::File { metadata, .. } => metadata,
            Self::Url { metadata, .. } => metadata,
            Self::Generic { metadata, .. } => metadata,
            Self::Action { metadata, .. } => metadata,
        };
        if let Some(data) = serialized {
            if let Ok(meta) = serde_json::from_value::<Meta>(data.clone()) {
                Some(meta)
            } else {
                None
            }
        } else {
            None
        }
    }
}

#[derive(Serialize, Deserialize, Clone, Debug, Builder, Default)]
#[builder(setter(into, strip_option))]
pub struct PluginMetadata {
    pub id: String,
    pub name: String,

    #[builder(default)]
    pub grants: Vec<GrantAction>,
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
    pub config: Vec<PluginArgument>,
}

impl PluginMetadataBuilder {
    pub fn minimal<Id: AsRef<str>, Name: AsRef<str>, Version: AsRef<str>>(id: Id, name: Name, version: Version) -> Self {
        Self {
            id: Some(id.as_ref().to_string()),
            name: Some(name.as_ref().to_string()),
            version: Some(version.as_ref().to_string()),
            grants: None,
            author: None,
            url: None,
            description: None,
            icon: None,
            config: None
        }
    }

    pub fn with_grant(&mut self, grant: GrantAction) -> &mut Self {
        if self.grants.is_none() {
            self.grants(Vec::new());
        }

        let mut grants = self.grants.clone().unwrap();
        grants.push(grant);
        self.grants(grants);
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
        for entry in self.config.clone().unwrap_or_default() {
            if let FieldType::PluginDefined { context, method } = entry.field {
                if !matches!(context, PluginDefinedMethodContext::Plugin) {
                    return Err(format!("Plugin-defined method {method} used in incorrect context (must be in Plugin context)"));
                }
            }
        }
        Ok(())
    }
}
