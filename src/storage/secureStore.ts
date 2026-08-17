import { invoke } from "@tauri-apps/api/core";

/**
 * OS-keychain-backed storage for integration credentials (Windows Credential
 * Manager / macOS Keychain / Linux Secret Service via the Rust `keyring`
 * crate). Never use SQLite or a plaintext file for tokens — see
 * src-tauri/src/lib.rs's secure_* commands and PRODUCT_SPEC.md.
 */
export async function secureSet(service: string, account: string, value: string): Promise<void> {
  await invoke("secure_set", { service, account, value });
}

export async function secureGet(service: string, account: string): Promise<string | null> {
  return invoke<string | null>("secure_get", { service, account });
}

export async function secureDelete(service: string, account: string): Promise<void> {
  await invoke("secure_delete", { service, account });
}
