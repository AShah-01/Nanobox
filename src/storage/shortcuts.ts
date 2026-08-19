import { invoke } from "@tauri-apps/api/core";
import { getDb } from "./db";

export interface Shortcut {
  id: number;
  label: string;
  target_path: string;
  sort_order: number;
  icon_data: string | null;
}

export async function listShortcuts(): Promise<Shortcut[]> {
  const db = await getDb();
  return db.select<Shortcut[]>("SELECT * FROM shortcuts ORDER BY sort_order ASC, id ASC");
}

export async function createShortcut(input: { label: string; target_path: string }): Promise<number> {
  const db = await getDb();
  const [{ n }] = await db.select<{ n: number }[]>("SELECT COUNT(*) as n FROM shortcuts");
  const result = await db.execute("INSERT INTO shortcuts (label, target_path, sort_order) VALUES ($1, $2, $3)", [
    input.label,
    input.target_path,
    n,
  ]);
  return result.lastInsertId as number;
}

export async function renameShortcut(id: number, label: string): Promise<void> {
  const db = await getDb();
  await db.execute("UPDATE shortcuts SET label = $1 WHERE id = $2", [label, id]);
}

export async function deleteShortcut(id: number): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM shortcuts WHERE id = $1", [id]);
}

/** Persists an extracted or custom icon (or clears it back to `null`, which makes the widget fall back to the first-letter avatar). */
export async function updateShortcutIcon(id: number, iconData: string | null): Promise<void> {
  const db = await getDb();
  await db.execute("UPDATE shortcuts SET icon_data = $1 WHERE id = $2", [iconData, id]);
}

/**
 * Calls into the Rust `extract_file_icon` command (src-tauri/src/icons.rs) to
 * pull the OS-associated icon for a shortcut target and returns it as a
 * `data:image/png;base64,...` URL, or `null` if extraction isn't available
 * (unsupported platform, missing file, etc). Never throws — icon extraction
 * is best-effort and the widget already has a first-letter fallback.
 */
export async function extractFileIcon(targetPath: string): Promise<string | null> {
  try {
    return await invoke<string | null>("extract_file_icon", { path: targetPath });
  } catch (err) {
    console.error("failed to extract icon", err);
    return null;
  }
}

/** Reads a user-picked image file (from the "Choose custom icon..." dialog) and returns it as a `data:` URL. */
export async function readImageAsDataUrl(path: string): Promise<string> {
  return invoke<string>("read_image_as_data_url", { path });
}
