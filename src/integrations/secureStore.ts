import { invoke } from "@tauri-apps/api/core";

/**
 * Thin wrapper around the Rust `keychain` commands (src-tauri/src/keychain.rs),
 * which store secrets in the OS-native credential store (Windows Credential
 * Manager / macOS Keychain / Linux Secret Service) via the `keyring` crate.
 * Nothing that touches this module is ever written to SQLite or a plaintext
 * file — that's the Milestone 5 "secure token storage" requirement.
 */
export async function setSecret(key: string, value: string): Promise<void> {
  await invoke("secure_set", { key, value });
}

export async function getSecret(key: string): Promise<string | null> {
  return invoke<string | null>("secure_get", { key });
}

export async function deleteSecret(key: string): Promise<void> {
  await invoke("secure_delete", { key });
}
