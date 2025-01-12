use extism_pdk::{debug, http::request, Error, HttpRequest, HttpResponse, ToMemory};

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
        let req = HttpRequest::new(self.url(endpoint)).with_method("GET").with_header("Authorization", self.auth());
        debug!("GET: {}", serde_json::to_string_pretty(&req).unwrap_or_default().to_string());
        match request::<()>(&req, None) {
            Ok(resp) => {
                debug!("Successful request: {}", String::from_utf8(resp.body()).unwrap_or(String::from("NON-UTF8")));
                Ok(resp)
            },
            Err(e) => {
                debug!("Failed request: {e:?}");
                Err(e)
            }
        }
    }

    pub fn delete(&self, endpoint: impl AsRef<str>) -> Result<HttpResponse, Error> {
        let req = HttpRequest::new(self.url(endpoint)).with_method("DELETE").with_header("Authorization", self.auth());
        debug!("DELETE: {}", serde_json::to_string_pretty(&req).unwrap_or_default().to_string());
        match request::<()>(&req, None) {
            Ok(resp) => {
                debug!("Successful request: {}", String::from_utf8(resp.body()).unwrap_or(String::from("NON-UTF8")));
                Ok(resp)
            },
            Err(e) => {
                debug!("Failed request: {e:?}");
                Err(e)
            }
        }
    }

    pub fn post<T: ToMemory>(&self, endpoint: impl AsRef<str>, data: Option<T>) -> Result<HttpResponse, Error> {
        let req = HttpRequest::new(self.url(endpoint)).with_method("POST").with_header("Authorization", self.auth()).with_header("Content-Type", "application/json");
        debug!("POST: {}", serde_json::to_string_pretty(&req).unwrap_or_default().to_string());
        match request::<T>(&req, data) {
            Ok(resp) => {
                debug!("Successful request: {}", String::from_utf8(resp.body()).unwrap_or(String::from("NON-UTF8")));
                Ok(resp)
            },
            Err(e) => {
                debug!("Failed request: {e:?}");
                Err(e)
            }
        }
    }
}

impl From<JellyfinPluginConfig> for Connection {
    fn from(value: JellyfinPluginConfig) -> Self {
        Connection::new(&value)
    }
}
