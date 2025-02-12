use std::{collections::HashMap, fmt::Debug};

use cryptoxide::{digest::Digest, sha2::Sha512};
use derive_builder::Builder;
use extism_pdk::{FromBytes, ToBytes};
use serde::{de::DeserializeOwned, Deserialize, Serialize};
use serde_json::Value;

pub mod params;
pub mod call;

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
    Admin
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "snake_case")]
pub enum ExpectedType {
    String,
    Integer,
    Float,
    Unsigned,
    Boolean,
    StringArray
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "snake_case")]
pub enum NumberType {
    Integer,
    Float,
    Unsigned
}

impl Default for NumberType {
    fn default() -> Self {
        NumberType::Float
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
        validation: Option<String>,
    },
    Number {
        #[serde(default)]
        placeholder: Option<String>,

        #[serde(default)]
        kind: NumberType,

        #[serde(default)]
        min: Option<f64>,

        #[serde(default)]
        max: Option<f64>,
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

        #[serde(default)]
        placeholder: Option<String>,
    },
    PluginDefined {
        method: String,
        context: PluginDefinedMethodContext,
        expected_type: ExpectedType
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
    pub description: Option<String>,

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

impl PluginArgument {
    pub fn validate(&self, value: Value) -> bool {
        match self.field.clone() {
            FieldType::Text {..} => value.as_str().map_or(false, |_| true),
            FieldType::Number {kind, min, max, ..} => {
                match kind {
                    NumberType::Integer => {
                        if let Some(val) = value.as_i64() {
                            min.is_none_or(|m| m <= val as f64) && max.is_none_or(|m| m >= val as f64)
                        } else {
                            false
                        }
                    },
                    NumberType::Float => {
                        if let Some(val) = value.as_f64() {
                            min.is_none_or(|m| m <= val) && max.is_none_or(|m| m >= val)
                        } else {
                            false
                        }
                    },
                    NumberType::Unsigned => {
                        if let Some(val) = value.as_u64() {
                            min.is_none_or(|m| m <= val as f64) && max.is_none_or(|m| m >= val as f64)
                        } else {
                            false
                        }
                    }
                }
            },
            FieldType::Select {options, multiple} => {
                let keys = options.iter().map(|field| match field {
                    FieldSelectOption::Exact(v) => v.to_string(),
                    FieldSelectOption::Alias { value, .. } => value.to_string()
                }).collect::<Vec<String>>();
                if multiple {
                    if let Some(vals) = value.as_array() {
                        for val in vals {
                            if let Some(s) = val.as_str() {
                                if !keys.contains(&s.to_string()) {
                                    return false;
                                }
                            } else {
                                return false;
                            }
                        }
                        true
                    } else {
                        false
                    }
                } else {
                    if let Some(val) = value.as_str() {
                        keys.contains(&val.to_string())
                    } else {
                        false
                    }
                }
            },
            FieldType::Switch {} => value.as_bool().is_some(),
            FieldType::TextArea { .. } => value.as_str().is_some(),
            FieldType::PluginDefined { expected_type, .. } => match expected_type {
                ExpectedType::Boolean => value.as_bool().is_some(),
                ExpectedType::Float => value.as_f64().is_some(),
                ExpectedType::Integer => value.as_i64().is_some(),
                ExpectedType::Unsigned => value.as_u64().is_some(),
                ExpectedType::String => value.as_str().is_some(),
                ExpectedType::StringArray => value.as_array().is_some_and(|arr| arr.iter().all(|v| v.as_str().is_some()))
            }
        }
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ValidatedArgument {
    pub argument: PluginArgument,
    pub valid: bool,
    pub value: Option<Value>,
    pub previous: Option<Value>
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ValidationResult {
    pub valid: bool,
    pub arguments: HashMap<String, ValidatedArgument>
}

pub trait ArgValidator {
    fn validate(&self, fields: HashMap<String, Value>) -> ValidationResult;
}

impl ArgValidator for Vec<PluginArgument> {
    fn validate(&self, fields: HashMap<String, Value>) -> ValidationResult {
        let mut results: HashMap<String, ValidatedArgument> = HashMap::new();
        let mut is_valid = true;
        for arg in self {
            if let Some(val) = fields.get(&arg.key) {
                if arg.validate(val.clone()) {
                    results.insert(arg.key.clone(), ValidatedArgument {
                        argument: arg.clone(),
                        valid: true,
                        value: Some(val.clone()),
                        previous: None
                    });
                } else {
                    results.insert(arg.key.clone(), ValidatedArgument {
                        argument: arg.clone(),
                        valid: false,
                        value: arg.default.clone(),
                        previous: Some(val.clone())
                    });
                    is_valid = false;
                }
            } else {
                results.insert(arg.key.clone(), ValidatedArgument {
                    argument: arg.clone(),
                    valid: !arg.required,
                    value: arg.default.clone(),
                    previous: None
                });
                if arg.required {
                    is_valid = false;
                }
            }
        }

        ValidationResult {
            valid: is_valid,
            arguments: results
        }
        
    }
}

impl FieldBuilder {
    pub fn minimal<Key: AsRef<str>, Label: AsRef<str>>(key: Key, label: Label, field: FieldType) -> Self {
        Self {
            key: Some(key.as_ref().to_string()),
            label: Some(label.as_ref().to_string()),
            field: Some(field),
            icon: None,
            required: Some(false),
            default: None,
            description: None
        }
    }
}

#[derive(Serialize, Deserialize, Clone, Debug, Builder)]
#[builder(setter(into, strip_option))]
pub struct AdminAction {
    pub key: String,
    pub method: String,
    pub label: String,

    #[serde(default)]
    #[builder(default = "Vec::new()")]
    pub arguments: Vec<PluginArgument>,

    #[serde(default)]
    #[builder(default = "None")]
    pub description: Option<String>,

    #[serde(default)]
    #[builder(default = "None")]
    pub icon: Option<String>,
}

impl AdminActionBuilder {
    pub fn minimal<Key: AsRef<str>, Method: AsRef<str>, Label: AsRef<str>>(key: Key, method: Method, label: Label) -> Self {
        Self {
            key: Some(key.as_ref().to_string()),
            method: Some(method.as_ref().to_string()),
            label: Some(label.as_ref().to_string()),
            arguments: None,
            description: None,
            icon: None
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

    pub fn validate(&self) -> Result<(), String> {
        for entry in self.arguments.clone().unwrap_or_default() {
            if let FieldType::PluginDefined { context, method, .. } = entry.field {
                if !matches!(context, PluginDefinedMethodContext::Admin) {
                    return Err(format!("Plugin-defined method {method} used in incorrect context (must be in Admin context)"));
                }
            }
        }
        Ok(())
    }
}

impl AdminAction {
    pub fn get_argument(&self, key: impl AsRef<str>) -> Option<PluginArgument> {
        self.arguments.iter().find(|f| f.key == key.as_ref().to_string()).cloned()
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

    #[serde(default)]
    #[builder(default = "Vec::new()")]
    pub admin_actions: Vec<AdminAction>
}

impl GrantAction {
    pub fn get_option(&self, key: impl AsRef<str>) -> Option<PluginArgument> {
        self.options.iter().find(|f| f.key == key.as_ref().to_string()).cloned()
    }

    pub fn get_argument(&self, key: impl AsRef<str>) -> Option<PluginArgument> {
        self.arguments.iter().find(|f| f.key == key.as_ref().to_string()).cloned()
    }

    pub fn get_admin_action(&self, key: impl AsRef<str>) -> Option<AdminAction> {
        self.admin_actions.iter().find(|f| f.key == key.as_ref().to_string()).cloned()
    }
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
            revoke_method: None,
            admin_actions: None
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

    pub fn with_admin_action(&mut self, action: AdminAction) -> &mut Self {
        if self.admin_actions.is_none() {
            self.admin_actions(Vec::new());
        }

        let mut actions = self.admin_actions.clone().unwrap();
        actions.push(action);
        actions.dedup_by(|a, b| a.key.eq_ignore_ascii_case(&b.key));
        self.admin_actions(actions);
        self
    }

    pub fn validate(&self) -> Result<(), String> {
        for entry in self.options.clone().unwrap_or_default() {
            if let FieldType::PluginDefined { context, method, .. } = entry.field {
                if !matches!(context, PluginDefinedMethodContext::Service) {
                    return Err(format!("Plugin-defined method {method} used in incorrect context (must be in Service context)"));
                }
            }
        }
        for entry in self.arguments.clone().unwrap_or_default() {
            if let FieldType::PluginDefined { context, method, .. } = entry.field {
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
        password: Option<HashedPassword>,

        #[serde(default = "Default::default")]
        metadata: Option<Value>,
    },
    File {
        id: String,

        file_id: String,

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
        name: String,

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
            if let FieldType::PluginDefined { context, method, .. } = entry.field {
                if !matches!(context, PluginDefinedMethodContext::Plugin) {
                    return Err(format!("Plugin-defined method {method} used in incorrect context (must be in Plugin context)"));
                }
            }
        }
        Ok(())
    }
}



#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct HashedPassword(String);

impl HashedPassword {
    pub fn new<T: AsRef<str>>(password: T) -> Self {
        Self(Self::hash(password.as_ref()))
    }

    fn hash(input: impl AsRef<str>) -> String {
        let mut hasher = Sha512::new();
        hasher.input_str(input.as_ref());
        hasher.result_str()
    }

    pub fn verify<T: AsRef<str>>(&self, test: T) -> bool {
        let check = Self::hash(test.as_ref());
        check == self.0
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct PluginFileData {
    pub data: Vec<u8>,
    pub filename: Option<String>,
    pub content_type: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ExtError(String);

impl<T: ToString> From<T> for ExtError {
    fn from(value: T) -> Self {
        Self(value.to_string())
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub enum ExtResult<T> {
    Ok(T),
    Err(ExtError)
}

impl<T> From<Result<T, ExtError>> for ExtResult<T> {
    fn from(value: Result<T, ExtError>) -> Self {
        match value {
            Ok(v) => ExtResult::Ok(v),
            Err(e) => ExtResult::Err(e)
        }
    }
}

impl<T> Into<Result<T, ExtError>> for ExtResult<T> {
    fn into(self) -> Result<T, ExtError> {
        match self {
            Self::Ok(v) => Ok(v),
            Self::Err(e) => Err(e)
        }
    }
}

impl<'a, T: ToBytes<'a> + Serialize + DeserializeOwned> ToBytes<'a> for ExtResult<T> {
    type Bytes = String;
    fn to_bytes(&self) -> Result<Self::Bytes, anyhow::Error> {
        match serde_json::to_string(self) {
            Ok(r) => Ok(r),
            Err(e) => Err(anyhow::Error::msg(e.to_string()))
        }
    }
}

impl<'a, T: FromBytes<'a> + Serialize + DeserializeOwned> FromBytes<'a> for ExtResult<T> {
    fn from_bytes(data: &'a [u8]) -> Result<Self, anyhow::Error> {
        match serde_json::from_slice(data) {
            Ok(v) => Ok(v),
            Err(e) => Err(anyhow::Error::msg(e.to_string()))
        }
    }
}

