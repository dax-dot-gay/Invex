use bevy_reflect::Reflect;
use orion::{
    errors::UnknownCryptoError,
    pwhash::{hash_password, hash_password_verify, Password, PasswordHash},
};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug, Reflect)]
pub struct HashedPassword(String);

impl HashedPassword {
    pub fn new<T: AsRef<str>>(password: T) -> Result<Self, UnknownCryptoError> {
        let pass = Password::from_slice(password.as_ref().as_bytes())?;
        let hashed = hash_password(&pass, 3, 1 << 16)?;
        Ok(HashedPassword(hashed.unprotected_as_encoded().to_string()))
    }

    pub fn hash(&self) -> Result<PasswordHash, UnknownCryptoError> {
        PasswordHash::from_encoded(&self.0)
    }

    pub fn verify<T: AsRef<str>>(&self, test: T) -> bool {
        if let Ok(pass) = Password::from_slice(test.as_ref().as_bytes()) {
            if let Ok(hash) = self.hash() {
                return hash_password_verify(&hash, &pass).is_ok();
            }
        }
        false
    }
}
