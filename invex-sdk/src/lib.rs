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
    Configure {
        method: String,
        fields: Vec<PluginArgument>,
    },
    Grant {
        method: String,
        fields: Vec<PluginArgument>,
    },
    Revoke {
        method: String,
    },
    Action {
        label: String,
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

    pub fn validate(&self) -> Result<(), String> {
        if let Some(capabilities) = &self.capabilities {
            let mut count_configure = 0;
            let mut count_grant = 0;
            let mut count_revoke = 0;
            let mut actions = Vec::<String>::new();
            for capability in capabilities {
                match capability {
                    Capability::Configure { .. } => count_configure += 1,
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

            if count_configure != 1 {
                return Err(String::from(
                    "Plugins must expose exactly one Configure{} capability",
                ));
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

pub mod execution {
    use serde::{de::DeserializeOwned, Deserialize, Serialize};
    use serde_json::Value;
    use std::{collections::HashMap, error::Error, fmt::Debug};

    pub enum OptionsError {
        Format(serde_json::Error),
        NotFound,
    }

    pub trait TypedOptions: Serialize + DeserializeOwned + Clone + Debug {
        fn options(&self) -> &HashMap<String, Value>;

        fn option<T: DeserializeOwned, S: AsRef<str>>(&self, key: S) -> Result<T, OptionsError> {
            if let Some(val) = self.options().get(key.as_ref()) {
                serde_json::from_value::<T>(val.clone()).or_else(|e| Err(OptionsError::Format(e)))
            } else {
                Err(OptionsError::NotFound)
            }
        }
    }

    #[derive(Serialize, Deserialize)]
    pub enum PluginResult<T> {
        Ok(T),
        Err(String),
    }

    impl<T: DeserializeOwned + Serialize, E: Error> From<Result<T, E>> for PluginResult<T> {
        fn from(value: Result<T, E>) -> Self {
            match value {
                Ok(s) => PluginResult::Ok(s),
                Err(e) => PluginResult::Err(e.to_string()),
            }
        }
    }

    impl<T: DeserializeOwned + Serialize> Into<Result<T, String>> for PluginResult<T> {
        fn into(self) -> Result<T, String> {
            match self {
                PluginResult::Ok(s) => Ok(s),
                PluginResult::Err(e) => Err(e),
            }
        }
    }

    impl<T: DeserializeOwned + Serialize> PluginResult<T> {
        pub fn ok(value: T) -> PluginResult<T> {
            PluginResult::Ok(value)
        }

        pub fn err<E: Error>(error: E) -> PluginResult<T> {
            PluginResult::Err(error.to_string())
        }
    }

    pub mod configure {
        use std::collections::HashMap;

        use serde::{Deserialize, Serialize};
        use serde_json::Value;

        use super::{PluginResult, TypedOptions};

        #[derive(Serialize, Deserialize, Clone, Debug)]
        pub struct Arguments {
            options: HashMap<String, Value>,
        }

        impl TypedOptions for Arguments {
            fn options(&self) -> &HashMap<String, Value> {
                &self.options
            }
        }

        pub type Result = PluginResult<()>;
    }

    pub mod grant {
        use std::collections::HashMap;

        use serde::{Deserialize, Serialize};
        use serde_json::Value;

        use crate::GrantResource;

        use super::{PluginResult, TypedOptions};

        #[derive(Serialize, Deserialize, Clone, Debug)]
        pub struct Arguments {
            options: HashMap<String, Value>,
        }

        impl TypedOptions for Arguments {
            fn options(&self) -> &HashMap<String, Value> {
                &self.options
            }
        }

        pub type Result<T> = PluginResult<Vec<GrantResource<T>>>;
    }

    pub mod revoke {
        use std::{collections::HashMap, fmt::Debug};

        use serde::{de::DeserializeOwned, Deserialize, Serialize};
        use serde_json::Value;

        use crate::GrantResource;

        use super::PluginResult;

        #[derive(Serialize, Deserialize, Clone, Debug)]
        pub struct Arguments {
            resources: Vec<Value>
        }

        impl<Meta: Serialize + DeserializeOwned + Clone + Debug> TryFrom<Vec<GrantResource<Meta>>> for Arguments {
            type Error = serde_json::Error;

            fn try_from(value: Vec<GrantResource<Meta>>) -> std::result::Result<Self, Self::Error> {
                let mut vals = Vec::<Value>::new();
                for val in value {
                    vals.push(serde_json::to_value(val)?);
                }

                Ok(Self {resources: vals})
            }
        }

        impl<Meta: Serialize + DeserializeOwned + Clone + Debug> TryInto<Vec<GrantResource<Meta>>> for Arguments {
            type Error = serde_json::Error;

            fn try_into(self) -> std::result::Result<Vec<GrantResource<Meta>>, Self::Error> {
                let mut vals = Vec::<GrantResource<Meta>>::new();
                for val in self.resources {
                    vals.push(serde_json::from_value(val)?);
                }

                Ok(vals)
            }
        }

        impl Arguments {
            pub fn resources<Meta: Serialize + DeserializeOwned + Clone + Debug>(&self) -> std::result::Result<HashMap<String, GrantResource<Meta>>, serde_json::Error> {
                let mut mapping = HashMap::<String, GrantResource<Meta>>::new();
                for item in TryInto::<Vec<GrantResource<Meta>>>::try_into(self.clone())? {
                    mapping.insert(item.id(), item.clone());
                }

                Ok(mapping)
            }

            pub fn resource<Meta: Serialize + DeserializeOwned + Clone + Debug, S: AsRef<str>>(&self, key: S) -> Option<GrantResource<Meta>> {
                if let Ok(mapping) = self.resources() {
                    mapping.get(&key.as_ref().to_string()).and_then(|r| Some(r.clone()))
                } else {
                    None
                }
            }
        }

        pub type Result = PluginResult<()>;
    }

    pub mod action {
        use std::{collections::HashMap, fmt::Debug};

        use serde::{de::DeserializeOwned, Deserialize, Serialize};
        use serde_json::Value;

        use crate::GrantResource;

        use super::{PluginResult, TypedOptions};

        #[derive(Serialize, Deserialize, Clone, Debug)]
        pub struct Arguments {
            options: HashMap<String, Value>,
            resources: Vec<Value>
        }

        impl TypedOptions for Arguments {
            fn options(&self) -> &HashMap<String, Value> {
                &self.options
            }
        }

        impl Arguments {
            pub fn resources<Meta: Serialize + DeserializeOwned + Clone + Debug>(&self) -> std::result::Result<HashMap<String, GrantResource<Meta>>, serde_json::Error> {
                let mut mapping = HashMap::<String, GrantResource<Meta>>::new();
                for resource in self.resources.clone() {
                    let item = serde_json::from_value::<GrantResource<Meta>>(resource)?;
                    mapping.insert(item.id(), item.clone());
                }

                Ok(mapping)
            }

            pub fn resource<Meta: Serialize + DeserializeOwned + Clone + Debug, S: AsRef<str>>(&self, key: S) -> Option<GrantResource<Meta>> {
                if let Ok(mapping) = self.resources() {
                    mapping.get(&key.as_ref().to_string()).and_then(|r| Some(r.clone()))
                } else {
                    None
                }
            }
        }

        pub type Result<T> = PluginResult<Vec<GrantResource<T>>>;
    }
}
