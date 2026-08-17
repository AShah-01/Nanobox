import { invoke } from "@tauri-apps/api/core";
import { join } from "@tauri-apps/api/path";

export interface NanowidgetFile {
  title: string;
  html: string;
  css: string;
  js: string;
}

function slugify(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "untitled-widget";
}

/**
 * Saves a copy of a Custom Widget's code as a standalone `.nanowidget.json`
 * file in a dedicated app-data folder, alongside its existing SQLite copy —
 * so it's a real, browsable, portable file, not just a database row. SQLite
 * stays the source the app actually reads from at runtime; this is a
 * human-visible export, not a second source of truth.
 */
export async function saveCustomWidgetFile(instanceId: number, widget: NanowidgetFile): Promise<string> {
  const dir = await invoke<string>("custom_widgets_dir");
  const filename = `${slugify(widget.title)}-${instanceId}.nanowidget.json`;
  const path = await join(dir, filename);
  await invoke("write_text_file", { path, contents: JSON.stringify(widget, null, 2) });
  return path;
}
