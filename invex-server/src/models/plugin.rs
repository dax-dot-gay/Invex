use bevy_reflect::Reflect;
use extism::Wasm;
use invex_macros::Document;
use reqwest::header::HeaderValue;
use rocket::futures::AsyncWriteExt;
use serde::{Deserialize, Serialize};

use crate::util::{database::{File, FileInfo, Fs, Id}, plugins::PluginInfo, InResult};

#[derive(Serialize, Deserialize, Clone, Debug, Reflect, Document)]
pub struct RegisteredPlugin {
    #[serde(rename = "_id")]
    pub id: Id,
    pub info: PluginInfo,
    pub source: FileInfo,
    pub url: Option<String>,
    pub enabled: bool
}

impl RegisteredPlugin {
    pub async fn from_file(file: File) -> InResult<Self> {
        let temp = file.clone().read_to_temp().await?;
        let plugin = PluginInfo::from_wasm(Wasm::file(temp.path())).await?;
        Ok(RegisteredPlugin {
            id: Id::default(),
            info: plugin,
            source: file.into(),
            enabled: true,
            url: None
        })
    }

    pub async fn from_url(url: String, fs: Fs) -> InResult<Self> {
        let req = reqwest::get(url.clone()).await?.error_for_status()?;
        let headers = req.headers().clone();
        let content = req.bytes().await?;
        let (file, mut uploader) = fs.get_uploader(headers.get("Content-Type").unwrap_or(&HeaderValue::from_static("application/wasm")).to_str()?.to_string(), None).await?;
        for chunk in content.chunks(1024 ^ 2) {
            uploader.write_all(chunk).await?;
        }
        uploader.close().await?;
        let mut result = RegisteredPlugin::from_file(file).await?;
        result.url = Some(url);
        Ok(result)
    }
}