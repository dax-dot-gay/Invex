use anyhow::Error;
use bevy_reflect::Reflect;
use bson::doc;
use extism::{
    convert::Json, host_fn, Function, Manifest, Plugin as ExtismPlugin, PluginBuilder, UserData, Wasm, PTR
};
use invex_macros::Document;

#[allow(unused_imports)]
use invex_sdk::{ GrantAction, PluginArgument, PluginFileData, PluginMetadata, ExtResult };
use reqwest::header::HeaderValue;
use rocket::{
    futures::{ AsyncWriteExt, TryStreamExt },
    http::Status,
    request::{ self, FromRequest },
    Request,
};
use serde::{ de::DeserializeOwned, Deserialize, Serialize };
use serde_json::Value;
use std::{ collections::HashMap, sync::Arc };
use tokio::{ io::{ AsyncBufRead, AsyncReadExt }, sync::Mutex };

use crate::util::{ database::{ Docs, File, FileInfo, Fs, Id }, InResult, PluginRegistryMap };

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
    pub options: HashMap<String, Value>,
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

    pub fn get_field(&self, key: impl AsRef<str>) -> Option<PluginArgument> {
        self.metadata()
            .config.iter()
            .find(|f| f.key == key.as_ref().to_string())
            .cloned()
    }

    pub fn get_grant(&self, key: impl AsRef<str>) -> Option<GrantAction> {
        self.metadata()
            .grants.iter()
            .find(|f| f.key == key.as_ref().to_string())
            .cloned()
    }

    pub async fn call<A: Serialize + DeserializeOwned, R: Serialize + DeserializeOwned>(
        &self,
        method: impl AsRef<str>,
        argument: A
    ) -> Result<R, (Error, i32)> {
        let _method = method.as_ref().to_string();
        let _arg = serde_json
            ::to_value(argument)
            .or(Err((Error::msg("Failed to wrap argument"), 500)))?;
        let plugin = self.plugin.clone();
        if
            let Ok(result) = tokio::task::spawn_blocking(move || {
                let mut plugin = plugin.blocking_lock();
                let unwrapped_arg = serde_json
                    ::from_value::<A>(_arg)
                    .or(Err((Error::msg("Failed to unwrap argument"), 500)))?;
                let raw_result = plugin.call_get_error_code::<_, Json<R>>(
                    _method,
                    Json(unwrapped_arg)
                );
                match raw_result {
                    Ok(r) =>
                        serde_json
                            ::to_value(r.into_inner())
                            .and_then(|v| Ok(v))
                            .or(Err((Error::msg("Failed to wrap raw result"), 500))),
                    Err(e) => Err(e),
                }
            }).await
        {
            match result {
                Ok(r) =>
                    serde_json
                        ::from_value::<R>(r)
                        .and_then(|v| Ok(v))
                        .or(Err((Error::msg("Failed to unwrap raw result"), 500))),
                Err(e) => Err(e),
            }
        } else {
            Err((Error::msg("Failed to execute plugin method in an asynchronous context"), 500))
        }
    }
}

pub struct PluginRegistry {
    backend: PluginRegistryMap,
    documents: Docs<RegisteredPlugin>,
    fs: Fs,
}

#[rocket::async_trait]
impl<'r> FromRequest<'r> for PluginRegistry {
    type Error = ApiError;

    async fn from_request(req: &'r Request<'_>) -> request::Outcome<Self, Self::Error> {
        if let Some(backend) = req.rocket().state::<PluginRegistryMap>() {
            match req.guard::<Docs<RegisteredPlugin>>().await {
                request::Outcome::Success(docs) =>
                    match req.guard::<Fs>().await {
                        request::Outcome::Success(fs) =>
                            request::Outcome::Success(Self {
                                backend: backend.clone(),
                                documents: docs,
                                fs: fs.clone(),
                            }),
                        request::Outcome::Error(e) => request::Outcome::Error(e),
                        request::Outcome::Forward(_) => panic!("Unreachable!"),
                    }
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

host_fn!(fs_load(user_data: Fs; id: String) -> Json<PluginFileData> {
    tokio::runtime::Builder::new_multi_thread().enable_all().build()?.block_on(async move {
        let fs = user_data.get()?;
        let fs = fs.lock().unwrap();
        if let Some(file) = fs.get_file(id.into()).await {
            Ok(Json(PluginFileData {
                data: file.read().await.unwrap(),
                filename: file.original_filename.clone(),
                content_type: file.content_type.clone()
            }))
        } else {
            Err(anyhow::Error::msg("Unknown file ID"))
        }
    })
});

host_fn!(fs_store(user_data: Fs; data: Json<PluginFileData>) -> String {
    tokio::runtime::Builder::new_multi_thread().enable_all().build()?.block_on(async move {
        let fs = user_data.get()?;
        let fs = fs.lock().unwrap();
        let file = data.into_inner();
        let (file_instance, mut uploader) = fs.get_uploader(file.content_type.clone(), file.filename.clone()).await.unwrap();
        uploader.write_all(file.data.as_slice()).await.unwrap();
        uploader.flush().await.unwrap();
        uploader.close().await.unwrap();
        Ok(file_instance.id.to_string())
    })
});

impl PluginRegistry {
    pub fn new(registry: PluginRegistryMap, documents: Docs<RegisteredPlugin>, fs: Fs) -> Self {
        PluginRegistry {
            backend: registry,
            documents,
            fs,
        }
    }

    async fn resolve(&self, file: File) -> InResult<(ExtismPlugin, PluginMetadata)> {
        let temp = file.clone().read_to_temp().await?;
        let wasm = Wasm::file(temp.path());
        let manifest = Manifest::new([wasm]).with_allowed_host("*");
        let mut plugin = PluginBuilder::new(manifest)
            .with_wasi(true)
            .with_function("fs_load", [PTR], [PTR], UserData::new(self.fs.clone()), fs_load)
            .with_function("fs_store", [PTR], [PTR], UserData::new(self.fs.clone()), fs_store)
            .build()?;
        let metadata = plugin.call::<(), Json<PluginMetadata>>("metadata", ())?.into_inner();
        Ok((plugin, metadata))
    }

    async fn store(
        &self,
        metadata: PluginMetadata,
        source: FileInfo,
        url: Option<String>
    ) -> InResult<RegisteredPlugin> {
        if
            let Some(existing) = self.documents.query_one(
                doc! { "metadata.id": metadata.id.clone() }
            ).await
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
                metadata: metadata.clone(),
                source,
                url,
                enabled: metadata.config.len() == 0,
            };
            self.documents.save(plugin.clone()).await?;
            Ok(plugin)
        }
    }

    pub async fn register_existing(&self, plugin: RegisteredPlugin) -> InResult<Plugin> {
        let mut registry = self.backend.lock().await;
        let file = File::from_info(plugin.source.clone(), &self.fs);
        let (plugin, metadata) = self.resolve(file.clone()).await?;
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
        let (plugin, metadata) = self.resolve(file.clone()).await?;
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
        let (file, mut uploader) = self.fs.get_uploader(
            headers
                .get("Content-Type")
                .unwrap_or(&HeaderValue::from_static("application/wasm"))
                .to_str()?
                .to_string(),
            None
        ).await?;
        for chunk in content.chunks(1024 ^ 2) {
            uploader.write_all(chunk).await?;
        }
        uploader.close().await?;
        let (plugin, metadata) = self.resolve(file.clone()).await?;
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
        mut buffer: impl AsyncBufRead + Unpin
    ) -> InResult<PluginInfo> {
        let mut data = Vec::<u8>::new();
        buffer.read_to_end(&mut data).await?;
        let wasm = Wasm::data(data);
        let manifest = Manifest::new([wasm]);
        let mut plugin = ExtismPlugin::new(&manifest, [
            Function::new("fs_store", [PTR], [PTR], UserData::new(self.fs.clone()), fs_store),
            Function::new("fs_load", [PTR], [PTR], UserData::new(self.fs.clone()), fs_load)
        ], true)?;
        let metadata = plugin.call::<(), Json<PluginMetadata>>("metadata", ())?.into_inner();
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
        let mut plugin = ExtismPlugin::new(&manifest, [
            Function::new("fs_store", [PTR], [PTR], UserData::new(self.fs.clone()), fs_store),
            Function::new("fs_load", [PTR], [PTR], UserData::new(self.fs.clone()), fs_load)
        ], true)?;
        let metadata = plugin.call::<(), Json<PluginMetadata>>("metadata", ())?.into_inner();
        Ok(PluginInfo {
            id: metadata.id.clone(),
            metadata: metadata.clone(),
            url: None,
            enabled: false,
        })
    }

    pub async fn get<T: AsRef<str>>(&self, id: T) -> Option<Plugin> {
        let registry = self.backend.lock().await;
        if
            let Some(info) = self.documents.query_one(
                doc! { "metadata.id": id.as_ref().to_string() }
            ).await
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
        Ok(
            self.documents
                .find(doc! {}).await?
                .try_collect::<Vec<RegisteredPlugin>>().await?
                .iter()
                .map(|v| PluginInfo::from(v.clone()))
                .collect()
        )
    }

    pub async fn deregister<T: AsRef<str>>(&self, id: T) -> () {
        if let Some(plugin) = self.get(id.as_ref().to_string()).await {
            let mut registry = self.backend.lock().await;
            let _ = self.fs.delete(plugin.file().id).await;
            let _ = self.documents.delete_many(
                doc! { "metadata.id": id.as_ref().to_string() }
            ).await;
            let _ = registry.remove(&id.as_ref().to_string());
        }
    }

    pub async fn exists<T: AsRef<str>>(&self, id: T) -> bool {
        if
            let Ok(count) = self.documents.count_documents(
                doc! { "metadata.id": id.as_ref().to_string() }
            ).await
        {
            count > 0
        } else {
            false
        }
    }
}
