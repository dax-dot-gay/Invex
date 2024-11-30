use extism_pdk::*;

#[plugin_fn]
pub fn arbitrary_req(url: String) -> FnResult<String> {
    Ok(String::from_utf8(http::request::<()>(&HttpRequest::new(url), None)?.body())?)
}
