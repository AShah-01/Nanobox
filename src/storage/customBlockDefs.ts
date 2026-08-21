import { getDb } from "./db";
import type { PortType } from "../integrations/blockEngine/types";

/** One user-authored port, as stored in `inputs_json` / `outputs_json`. */
export interface CustomPortSpec {
  id: string;
  name: string;
  type: PortType;
}

/** Raw row shape of the `custom_block_defs` table (migration 10). */
export interface CustomBlockDefRow {
  id: number;
  def_id: string;
  label: string;
  description: string;
  inputs_json: string;
  outputs_json: string;
  js_body: string;
  created_at: number;
  updated_at: number;
}

/** Everything a caller supplies when creating or updating a definition. */
export interface CustomBlockDefInput {
  defId: string;
  label: string;
  description: string;
  inputs: CustomPortSpec[];
  outputs: CustomPortSpec[];
  jsBody: string;
}

/** Parses a stored ports column, tolerating corrupt JSON rather than throwing mid-render. */
export function parsePorts(json: string): CustomPortSpec[] {
  try {
    const parsed: unknown = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (p): p is CustomPortSpec =>
        typeof p === "object" && p !== null && typeof (p as CustomPortSpec).id === "string",
    );
  } catch {
    return [];
  }
}

export async function listCustomBlockDefs(): Promise<CustomBlockDefRow[]> {
  const db = await getDb();
  return db.select<CustomBlockDefRow[]>("SELECT * FROM custom_block_defs ORDER BY label ASC");
}

export async function getCustomBlockDef(id: number): Promise<CustomBlockDefRow | null> {
  const db = await getDb();
  const rows = await db.select<CustomBlockDefRow[]>("SELECT * FROM custom_block_defs WHERE id = $1", [id]);
  return rows[0] ?? null;
}

/** Inserts a new definition and returns its row id. */
export async function createCustomBlockDef(input: CustomBlockDefInput): Promise<number> {
  const db = await getDb();
  const result = await db.execute(
    `INSERT INTO custom_block_defs (def_id, label, description, inputs_json, outputs_json, js_body)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      input.defId,
      input.label,
      input.description,
      JSON.stringify(input.inputs),
      JSON.stringify(input.outputs),
      input.jsBody,
    ],
  );
  return result.lastInsertId as number;
}

export async function updateCustomBlockDef(id: number, input: CustomBlockDefInput): Promise<void> {
  const db = await getDb();
  await db.execute(
    `UPDATE custom_block_defs
     SET def_id = $1, label = $2, description = $3, inputs_json = $4, outputs_json = $5,
         js_body = $6, updated_at = unixepoch()
     WHERE id = $7`,
    [
      input.defId,
      input.label,
      input.description,
      JSON.stringify(input.inputs),
      JSON.stringify(input.outputs),
      input.jsBody,
      id,
    ],
  );
}

export async function deleteCustomBlockDef(id: number): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM custom_block_defs WHERE id = $1", [id]);
}
