use bevy_reflect::Reflect;
use bson::doc;
use extism::{convert::Json, Manifest, Plugin as ExtismPlugin, Wasm};
use invex_macros::Document;
use invex_sdk::PluginMetadata;
use reqwest::header::HeaderValue;
use rocket::{
    futures::{AsyncWriteExt, TryStreamExt},
    http::Status,
    request::{self, FromRequest},
    Request,
};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::{collections::HashMap, sync::Arc};
use tokio::{
    io::{AsyncBufRead, AsyncReadExt},
    sync::Mutex,
};

use crate::util::{
    database::{Docs, File, FileInfo, Fs, Id},
    InResult, PluginRegistryMap,
};

use super::error::ApiError;

#[derive(Serialize, Deserialize, Clone, Debug, Reflect, Document)]
pub struct RegisteredPlugin {
    #[serde(rename = "_id")]
    pub id: Id,

    #[reflect(ignore)]
    pub metadata: PluginMetadata,
    pub source: FileInfo,
    pub url: Option<String>,
    pub enabled: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug, Reflect, Document)]
pub struct PluginConfiguration {
    #[serde(rename = "_id")]
    pub id: Id,
    pub plugin: String,

    #[serde(default)]
    pub icon: Option<String>,
    pub name: String,

    #[reflect(ignore)]
    pub options: HashMap<String, Value>
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct PluginInfo {
    pub id: String,
    pub metadata: PluginMetadata,
    pub url: Option<String>,
    pub enabled: bool,
}

impl From<Plugin> for PluginInfo {
    fn from(value: Plugin) -> Self {
        PluginInfo {
            id: value.id(),
            metadata: value.metadata(),
            url: value.url(),
            enabled: value.enabled(),
        }
    }
}

impl From<RegisteredPlugin> for PluginInfo {
    fn from(value: RegisteredPlugin) -> Self {
        PluginInfo {
            id: value.metadata.id.clone(),
            metadata: value.metadata.clone(),
            url: value.url.clone(),
            enabled: value.enabled,
        }
    }
}

#[derive(Clone)]
#[allow(dead_code)]
pub struct Plugin {
    docs: Docs<RegisteredPlugin>,
    metadata: RegisteredPlugin,
    plugin: Arc<Mutex<ExtismPlugin>>,
}

impl Plugin {
    pub fn metadata(&self) -> PluginMetadata {
        self.metadata.metadata.clone()
    }

    pub fn url(&self) -> Option<String> {
        self.metadata.url.clone()
    }

    pub fn file(&self) -> FileInfo {
        self.metadata.source.clone()
    }

    pub fn enabled(&self) -> bool {
        self.metadata.enabled
    }

    pub fn set_enabled(&mut self, enabled: bool) {
        self.metadata.enabled = enabled;
    }

    #[allow(dead_code)]
    pub fn info(&self) -> RegisteredPlugin {
        self.metadata.clone()
    }

    pub fn id(&self) -> String {
        self.metadata.metadata.id.clone()
    }

    pub async fn save(&self) -> InResult<()> {
        self.docs.save(self.metadata.clone()).await?;
        Ok(())
    }
}

pub struct PluginRegistry {
    backend: PluginRegistryMap,
    documents: Docs<RegisteredPlugin>,
    fs: Fs
}

#[rocket::async_trait]
impl<'r> FromRequest<'r> for PluginRegistry {
    type Error = ApiError;

    async fn from_request(req: &'r Request<'_>) -> request::Outcome<Self, Self::Error> {
        if let Some(backend) = req.rocket().state::<PluginRegistryMap>() {
            match req.guard::<Docs<RegisteredPlugin>>().await {
                request::Outcome::Success(docs) => {
                    match req.guard::<Fs>().await {
                        request::Outcome::Success(fs) => request::Outcome::Success(Self {
                            backend: backend.clone(),
                            documents: docs,
                            fs: fs.clone()
                        }),
                        request::Outcome::Error(e) => request::Outcome::Error(e),
                        request::Outcome::Forward(_) => panic!("Unreachable!"),
                    }
                },
                request::Outcome::Error(e) => request::Outcome::Error(e),
                request::Outcome::Forward(_) => panic!("Unreachable!"),
            }
        } else {
            request::Outcome::Error((
                Status::InternalServerError,
                ApiError::Internal(String::from("Plugin instance registry not in state.")),
            ))
        }
    }
}

impl PluginRegistry {
    pub fn new(registry: PluginRegistryMap, documents: Docs<RegisteredPlugin>, fs: Fs) -> Self {
        PluginRegistry { backend: registry, documents, fs }
    }

    async fn resolve(file: File) -> InResult<(ExtismPlugin, PluginMetadata)> {
        let temp = file.clone().read_to_temp().await?;
        let wasm = Wasm::file(temp.path());
        let manifest = Manifest::new([wasm]);
        let mut plugin = ExtismPlugin::new(&manifest, [], true)?;
        let metadata = plugin
            .call::<(), Json<PluginMetadata>>("metadata", ())?
            .into_inner();
        Ok((plugin, metadata))
    }

    async fn store(
        &self,
        metadata: PluginMetadata,
        source: FileInfo,
        url: Option<String>,
    ) -> InResult<RegisteredPlugin> {
        if let Some(existing) = self
            .documents
            .query_one(doc! {"metadata.id": metadata.id.clone()})
            .await
        {
            let plugin = RegisteredPlugin {
                id: existing.id,
                metadata,
                source,
                url,
                enabled: existing.enabled,
            };
            self.documents.save(plugin.clone()).await?;
            Ok(plugin)
        } else {
            let plugin = RegisteredPlugin {
                id: Id::default(),
                metadata,
                source,
                url,
                enabled: true,
            };
            self.documents.save(plugin.clone()).await?;
            Ok(plugin)
        }
    }

    pub async fn register_existing(&self, plugin: RegisteredPlugin) -> InResult<Plugin> {
        let mut registry = self.backend.lock().await;
        let file = File::from_info(plugin.source.clone(), &self.fs);
        let (plugin, metadata) = Self::resolve(file.clone()).await?;
        let plugin_info = self.store(metadata, file.into(), None).await?;
        let plugin_arc = Arc::new(Mutex::new(plugin));
        registry.insert(plugin_info.metadata.id.clone(), plugin_arc.clone());
        Ok(Plugin {
            metadata: plugin_info,
            plugin: plugin_arc.clone(),
            docs: self.documents.clone(),
        })
    }

    pub async fn register_file(&self, file: File) -> InResult<Plugin> {
        let mut registry = self.backend.lock().await;
        let (plugin, metadata) = Self::resolve(file.clone()).await?;
        let plugin_info = self.store(metadata, file.into(), None).await?;
        let plugin_arc = Arc::new(Mutex::new(plugin));
        registry.insert(plugin_info.metadata.id.clone(), plugin_arc.clone());
        Ok(Plugin {
            metadata: plugin_info,
            plugin: plugin_arc.clone(),
            docs: self.documents.clone(),
        })
    }

    pub async fn register_url(&self, url: String) -> InResult<Plugin> {
        let mut registry = self.backend.lock().await;
        let req = reqwest::get(url.clone()).await?.error_for_status()?;
        let headers = req.headers().clone();
        let content = req.bytes().await?;
        let (file, mut uploader) = self.fs
            .get_uploader(
                headers
                    .get("Content-Type")
                    .unwrap_or(&HeaderValue::from_static("application/wasm"))
                    .to_str()?
                    .to_string(),
                None,
            )
            .await?;
        for chunk in content.chunks(1024 ^ 2) {
            uploader.write_all(chunk).await?;
        }
        uploader.close().await?;
        let (plugin, metadata) = Self::resolve(file.clone()).await?;
        let plugin_info = self.store(metadata, file.into(), Some(url)).await?;
        let plugin_arc = Arc::new(Mutex::new(plugin));
        registry.insert(plugin_info.metadata.id.clone(), plugin_arc.clone());
        Ok(Plugin {
            metadata: plugin_info,
            plugin: plugin_arc.clone(),
            docs: self.documents.clone(),
        })
    }

    pub async fn preview_file(
        &self,
        mut buffer: impl AsyncBufRead + Unpin,
    ) -> InResult<PluginInfo> {
        let mut data = Vec::<u8>::new();
        buffer.read_to_end(&mut data).await?;
        let wasm = Wasm::data(data);
        let manifest = Manifest::new([wasm]);
        let mut plugin = ExtismPlugin::new(&manifest, [], true)?;
        let metadata = plugin
            .call::<(), Json<PluginMetadata>>("metadata", ())?
            .into_inner();
        Ok(PluginInfo {
            id: metadata.id.clone(),
            metadata: metadata.clone(),
            url: None,
            enabled: false,
        })
    }

    pub async fn preview_url(&self, url: String) -> InResult<PluginInfo> {
        let req = reqwest::get(url.clone()).await?.error_for_status()?;
        let content = req.bytes().await?;
        let wasm = Wasm::data(content);
        let manifest = Manifest::new([wasm]);
        let mut plugin = ExtismPlugin::new(&manifest, [], true)?;
        let metadata = plugin
            .call::<(), Json<PluginMetadata>>("metadata", ())?
            .into_inner();
        Ok(PluginInfo {
            id: metadata.id.clone(),
            metadata: metadata.clone(),
            url: None,
            enabled: false,
        })
    }

    pub async fn get<T: AsRef<str>>(&self, id: T) -> Option<Plugin> {
        let registry = self.backend.lock().await;
        if let Some(info) = self
            .documents
            .query_one(doc! {"metadata.id": id.as_ref().to_string()})
            .await
        {
            if let Some(instance) = registry.get(id.as_ref()) {
                Some(Plugin {
                    metadata: info,
                    plugin: instance.clone(),
                    docs: self.documents.clone(),
                })
            } else {
                None
            }
        } else {
            None
        }
    }

    pub async fn list(&self) -> InResult<Vec<PluginInfo>> {
        Ok(self
            .documents
            .find(doc! {})
            .await?
            .try_collect::<Vec<RegisteredPlugin>>()
            .await?
            .iter()
            .map(|v| PluginInfo::from(v.clone()))
            .collect())
    }

    pub async fn deregister<T: AsRef<str>>(&self, id: T) -> () {
        if let Some(plugin) = self.get(id.as_ref().to_string()).await {
            let mut registry = self.backend.lock().await;
            let _ = self.fs.delete(plugin.file().id).await;
            let _ = self
                .documents
                .delete_many(doc! {"metadata.id": id.as_ref().to_string()})
                .await;
            let _ = registry.remove(&id.as_ref().to_string());
        }
    }

    pub async fn exists<T: AsRef<str>>(&self, id: T) -> bool {
        if let Ok(count) = self.documents.count_documents(doc! {"metadata.id": id.as_ref().to_string()}).await {
            count > 0
        } else {
            false
        }
    }
}
