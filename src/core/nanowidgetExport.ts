import { invoke } from "@tauri-apps/api/core";
import { save, open as openDialog } from "@tauri-apps/plugin-dialog";
import type { BlockProgram } from "../integrations/blockEngine/types";
import { createBlockProgram } from "../storage/blockPrograms";

const SCHEMA_VERSION = 1;

interface NanowidgetFile {
  schemaVersion: number;
  name: string;
  program: BlockProgram;
}

/**
 * Prompts a native save dialog and writes the given program as a .nanowidget
 * JSON file. The program is embedded in full so the file is self-contained.
 */
export async function exportNanowidget(program: BlockProgram): Promise<void> {
  const file: NanowidgetFile = { schemaVersion: SCHEMA_VERSION, name: program.name, program };

  const path = await save({
    defaultPath: `${program.name}.nanowidget`,
    filters: [{ name: "Nanobox widget", extensions: ["nanowidget"] }],
  });
  if (!path) return; // user cancelled

  await invoke("write_text_file", { path, contents: JSON.stringify(file, null, 2) });
}

/**
 * Prompts a native open dialog for a .nanowidget file, validates it, imports
 * the program into the DB (as a new program, never overwriting existing ones),
 * and returns the new row id. Returns null if the user cancelled. Throws with
 * a user-facing message on a malformed file.
 */
export async function importNanowidget(): Promise<number | null> {
  const selected = await openDialog({
    multiple: false,
    filters: [{ name: "Nanobox widget", extensions: ["nanowidget"] }],
  });
  if (!selected || Array.isArray(selected)) return null;

  const text = await invoke<string>("read_text_file", { path: selected });
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("That file isn't valid JSON — not a .nanowidget file?");
  }

  const file = parsed as Partial<NanowidgetFile>;
  if (typeof file.schemaVersion !== "number") {
    throw new Error("This .nanowidget file is missing a schema version — it may be corrupted.");
  }
  const program = file.program;
  if (
    !program ||
    typeof program !== "object" ||
    typeof (program as BlockProgram).id !== "string" ||
    typeof (program as BlockProgram).name !== "string" ||
    !Array.isArray((program as BlockProgram).nodes) ||
    !Array.isArray((program as BlockProgram).edges)
  ) {
    throw new Error("This .nanowidget file's program data looks corrupted or incomplete.");
  }

  const newId = await createBlockProgram(program as BlockProgram);
  return newId;
}
