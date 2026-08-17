//! Secure token storage for Milestone 5 integrations (Google Calendar,
//! Spotify, ...). Backed by the `keyring` crate, which talks to each OS's
//! native credential store (Windows Credential Manager, macOS Keychain,
//! the Secret Service on Linux) — tokens never touch SQLite or a plaintext
//! file, per ROADMAP.md's Milestone 5 requirement.

use keyring::Entry;

const SERVICE: &str = "com.aagamshah.nanobox";

fn entry(key: &str) -> Result<Entry, String> {
    Entry::new(SERVICE, key).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn secure_set(key: String, value: String) -> Result<(), String> {
    entry(&key)?.set_password(&value).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn secure_get(key: String) -> Result<Option<String>, String> {
    match entry(&key)?.get_password() {
        Ok(value) => Ok(Some(value)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub fn secure_delete(key: String) -> Result<(), String> {
    match entry(&key)?.delete_credential() {
        Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
        Err(e) => Err(e.to_string()),
    }
}
