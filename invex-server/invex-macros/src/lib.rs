use proc_macro::TokenStream;
use quote::quote;
use syn::DeriveInput;

extern crate proc_macro;

#[proc_macro_derive(Document)]
pub fn derive_document(input: TokenStream) -> TokenStream {
    let ast: DeriveInput = syn::parse(input).unwrap();
    let name = &ast.ident;
    let gen = quote! {
        impl crate::util::database::Document for #name {
            fn id(&self) -> String {
                self.id.to_string()
            }
        }
    };
    gen.into()
}