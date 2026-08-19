import { invoke } from "@tauri-apps/api/core";
import { save, open as openDialog } from "@tauri-apps/plugin-dialog";
import { isThemeId, ThemeId } from "../themes/themes";
import { getThemeCustomization, setThemeCustomization, ThemeCustomization } from "./themeStore";

const SCHEMA_VERSION = 1;

interface NanothemeFile {
  schemaVersion: number;
  themeId: ThemeId;
  customization: ThemeCustomization;
}

function isThemeCustomization(value: unknown): value is ThemeCustomization {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  if (v.tint !== undefined && typeof v.tint !== "string") return false;
  if (v.fontScale !== undefined && typeof v.fontScale !== "number") return false;
  if (v.radius !== undefined && typeof v.radius !== "number") return false;
  if (v.borderStyle !== undefined && typeof v.borderStyle !== "string") return false;
  return true;
}

/** Prompts a save dialog and writes the given theme's current customization as a `.nanotheme` JSON file. */
export async function exportTheme(id: ThemeId): Promise<void> {
  const customization = getThemeCustomization(id);
  const file: NanothemeFile = { schemaVersion: SCHEMA_VERSION, themeId: id, customization };

  const path = await save({
    defaultPath: `${id}.nanotheme`,
    filters: [{ name: "Nanobox theme", extensions: ["nanotheme"] }],
  });
  if (!path) return; // user cancelled

  await invoke("write_text_file", { path, contents: JSON.stringify(file, null, 2) });
}

/**
 * Prompts an open dialog for a `.nanotheme` file and applies its customization.
 * Returns the theme id it was applied to, or null if the user cancelled.
 * Throws with a user-facing message on a malformed/unrecognised file.
 */
export async function importTheme(): Promise<ThemeId | null> {
  const selected = await openDialog({
    multiple: false,
    filters: [{ name: "Nanobox theme", extensions: ["nanotheme"] }],
  });
  if (!selected || Array.isArray(selected)) return null;

  const text = await invoke<string>("read_text_file", { path: selected });
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("That file isn't valid JSON — not a .nanotheme file?");
  }

  const file = parsed as Partial<NanothemeFile>;
  const themeId = file.themeId ?? null;
  if (!isThemeId(themeId)) {
    throw new Error(`Unrecognised theme "${String(file.themeId)}" — this .nanotheme may be from a newer version of Nanobox.`);
  }
  if (!isThemeCustomization(file.customization)) {
    throw new Error("This .nanotheme file's customization data looks corrupted.");
  }

  setThemeCustomization(themeId, file.customization);
  return themeId;
}
