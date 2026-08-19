import { getDb } from "./db";
import type { BlockProgram } from "../integrations/blockEngine/types";

export interface BlockProgramRow {
  id: number;
  name: string;
  program_json: string;
  created_at: string;
  updated_at: string;
}

export async function listBlockPrograms(): Promise<BlockProgramRow[]> {
  const db = await getDb();
  return db.select<BlockProgramRow[]>("SELECT * FROM block_programs ORDER BY updated_at DESC");
}

export async function getBlockProgram(id: number): Promise<BlockProgramRow | null> {
  const db = await getDb();
  const rows = await db.select<BlockProgramRow[]>("SELECT * FROM block_programs WHERE id = $1", [id]);
  return rows[0] ?? null;
}

/** Insert a new program (id is ignored) and return the new row's id. */
export async function createBlockProgram(program: BlockProgram): Promise<number> {
  const db = await getDb();
  const result = await db.execute("INSERT INTO block_programs (name, program_json) VALUES ($1, $2)", [
    program.name,
    JSON.stringify(program),
  ]);
  return result.lastInsertId as number;
}

export async function updateBlockProgram(id: number, program: BlockProgram): Promise<void> {
  const db = await getDb();
  await db.execute(
    "UPDATE block_programs SET name = $1, program_json = $2, updated_at = datetime('now') WHERE id = $3",
    [program.name, JSON.stringify(program), id],
  );
}

export async function deleteBlockProgram(id: number): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM block_programs WHERE id = $1", [id]);
}
