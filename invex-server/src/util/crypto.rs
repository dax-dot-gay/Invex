use base64::{engine::general_purpose::URL_SAFE, Engine};
use bevy_reflect::Reflect;
use orion::{
    errors::UnknownCryptoError,
    kdf::Salt,
    pwhash::{hash_password, hash_password_verify, Password, PasswordHash},
};
use serde::{de::DeserializeOwned, Deserialize, Serialize};

use super::InResult;

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

#[derive(Serialize, Deserialize, Clone, Debug, Reflect)]
pub struct CipherData(String);

impl CipherData {
    pub fn seal<T: AsRef<[u8]>>(key: orion::aead::SecretKey, data: T) -> Result<Self, UnknownCryptoError> {
        let encrypted = orion::aead::seal(&key, data.as_ref())?;
        Ok(CipherData(URL_SAFE.encode(encrypted)))
    }

    pub fn open(&self, key: orion::aead::SecretKey) -> Result<Vec<u8>, UnknownCryptoError> {
        let decoded = URL_SAFE.decode(self.0.clone()).expect("Invalid b64");
        orion::aead::open(&key, decoded.as_slice())
    }
}

#[derive(Serialize, Deserialize, Clone, Debug, Reflect)]
pub struct SecretKey(String);

impl SecretKey {
    pub fn derive<T: AsRef<str>>(password: T) -> Result<(Self, StoredSalt), UnknownCryptoError> {
        let salt = StoredSalt::default();
        let pass = Password::from_slice(password.as_ref().as_bytes())?;
        let key = orion::kdf::derive_key(&pass, &salt.clone().into(), 3, 1<<8, 32)?;
        Ok((SecretKey(URL_SAFE.encode(key.unprotected_as_bytes())), salt.clone()))
    }

    pub fn derive_with_salt<T: AsRef<str>>(password: T, salt: StoredSalt) -> Result<Self, UnknownCryptoError> {
        let pass = Password::from_slice(password.as_ref().as_bytes())?;
        let key = orion::kdf::derive_key(&pass, &salt.clone().into(), 3, 1<<8, 32)?;
        Ok(SecretKey(URL_SAFE.encode(key.unprotected_as_bytes())))
    }

    fn key(&self) -> InResult<orion::aead::SecretKey> {
        Ok(orion::aead::SecretKey::from_slice(URL_SAFE.decode(self.0.clone())?.as_slice())?)
    }

    pub fn encrypt<T: Serialize + DeserializeOwned>(&self, data: T) -> InResult<CipherData> {
        let serialized = serde_json::to_vec(&data)?;
        Ok(CipherData::seal(self.key()?, serialized)?)
    }

    pub fn decrypt<T: Serialize + DeserializeOwned>(&self, cipher: CipherData) -> InResult<T> {
        let decrypted = cipher.open(self.key()?)?;
        Ok(serde_json::from_slice(decrypted.as_slice())?)
    }
}

impl Default for SecretKey {
    fn default() -> Self {
        SecretKey(
            URL_SAFE.encode(
                orion::kdf::SecretKey::generate(32)
                    .expect("Current execution environment is insecure.")
                    .unprotected_as_bytes(),
            ),
        )
    }
}

#[derive(Serialize, Deserialize, Clone, Debug, Reflect)]
pub struct StoredSalt(String);

impl Default for StoredSalt {
    fn default() -> Self {
        let generated = Salt::default();
        let serialized = serde_json::to_vec(&generated).expect("Failed to serialize, unexpected.");
        StoredSalt(URL_SAFE.encode(serialized))
    }
}

impl Into<Salt> for StoredSalt {
    fn into(self) -> Salt {
        let data = URL_SAFE.decode(self.0).expect("Malformed contents");
        serde_json::from_slice::<Salt>(data.as_slice()).expect("Failed to deserialize salt")
    }
}
