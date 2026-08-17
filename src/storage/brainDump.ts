import { getDb } from "./db";

export interface BrainDumpEntry {
  id: number;
  text: string;
  created_at: string;
}

export async function listBrainDumpEntries(): Promise<BrainDumpEntry[]> {
  const db = await getDb();
  return db.select<BrainDumpEntry[]>("SELECT * FROM brain_dump_entries ORDER BY created_at DESC");
}

export async function createBrainDumpEntry(text: string): Promise<void> {
  const db = await getDb();
  await db.execute("INSERT INTO brain_dump_entries (text) VALUES ($1)", [text]);
}

export async function deleteBrainDumpEntry(id: number): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM brain_dump_entries WHERE id = $1", [id]);
}
