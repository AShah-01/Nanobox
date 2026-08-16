import { getDb } from "./db";

export interface Note {
  id: number;
  title: string;
  body: string;
  color: string | null;
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

/** Milestone 1 only needs the table to exist; the Notes widget (Milestone 2) adds create/update/delete. */
export async function listNotes(): Promise<Note[]> {
  const db = await getDb();
  return db.select<Note[]>("SELECT * FROM notes ORDER BY pinned DESC, updated_at DESC");
}
