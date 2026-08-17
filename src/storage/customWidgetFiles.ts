import { invoke } from "@tauri-apps/api/core";

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
 *
 * Goes through `save_custom_widget_file` (not a generic write-any-path
 * command) — the Rust side sanitizes the filename and always confines the
 * write to the custom-widgets folder, regardless of what's passed here.
 */
export async function saveCustomWidgetFile(instanceId: number, widget: NanowidgetFile): Promise<string> {
  const filename = `${slugify(widget.title)}-${instanceId}.nanowidget.json`;
  return invoke<string>("save_custom_widget_file", { filename, contents: JSON.stringify(widget, null, 2) });
}
