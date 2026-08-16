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

interface NoteRow extends Omit<Note, "pinned"> {
  pinned: number;
}

const fromRow = (row: NoteRow): Note => ({ ...row, pinned: Boolean(row.pinned) });

export async function listNotes(): Promise<Note[]> {
  const db = await getDb();
  const rows = await db.select<NoteRow[]>("SELECT * FROM notes ORDER BY pinned DESC, updated_at DESC");
  return rows.map(fromRow);
}

export async function createNote(input: { title: string; body: string; color: string | null }): Promise<void> {
  const db = await getDb();
  await db.execute("INSERT INTO notes (title, body, color) VALUES ($1, $2, $3)", [input.title, input.body, input.color]);
}

export async function updateNote(
  id: number,
  input: { title: string; body: string; color: string | null },
): Promise<void> {
  const db = await getDb();
  await db.execute(
    "UPDATE notes SET title = $1, body = $2, color = $3, updated_at = datetime('now') WHERE id = $4",
    [input.title, input.body, input.color, id],
  );
}

export async function deleteNote(id: number): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM notes WHERE id = $1", [id]);
}

export async function toggleNotePinned(id: number, pinned: boolean): Promise<void> {
  const db = await getDb();
  await db.execute("UPDATE notes SET pinned = $1, updated_at = datetime('now') WHERE id = $2", [pinned ? 1 : 0, id]);
}
