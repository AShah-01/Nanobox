import { isEnabled, enable } from "@tauri-apps/plugin-autostart";

/** Registers Nanobox to launch on login (Windows Run key / macOS launchd agent), once, on first run. */
export async function ensureAutostart() {
  if (!(await isEnabled())) {
    await enable();
  }
}
