use extism_pdk::{http::request, Error, HttpRequest, HttpResponse, ToMemory};

use crate::models::JellyfinPluginConfig;

pub struct Connection(JellyfinPluginConfig);

#[allow(dead_code)]
impl Connection {
    pub fn new(config: &JellyfinPluginConfig) -> Self {
        Self(config.clone())
    }

    pub fn url(&self, endpoint: impl AsRef<str>) -> String {
        let base = self.0.host.trim_end_matches("/");
        let path = endpoint.as_ref().trim_start_matches("/");
        format!("{base}/{path}")
    }

    pub fn auth(&self) -> String {
        format!("MediaBrowser Token=\"{}\"", self.0.api_key)
    }

    pub fn get(&self, endpoint: impl AsRef<str>) -> Result<HttpResponse, Error> {
        request::<()>(&HttpRequest::new(self.url(endpoint)).with_method("GET").with_header("Authorization", self.auth()), None)
    }

    pub fn delete(&self, endpoint: impl AsRef<str>) -> Result<HttpResponse, Error> {
        request::<()>(&HttpRequest::new(self.url(endpoint)).with_method("DELETE").with_header("Authorization", self.auth()), None)
    }

    pub fn post<T: ToMemory>(&self, endpoint: impl AsRef<str>, data: Option<T>) -> Result<HttpResponse, Error> {
        request::<T>(&HttpRequest::new(self.url(endpoint)).with_method("GET").with_header("Authorization", self.auth()), data)
    }
}

impl From<JellyfinPluginConfig> for Connection {
    fn from(value: JellyfinPluginConfig) -> Self {
        Connection::new(&value)
    }
}
