import { getDb } from "./db";

export interface Shortcut {
  id: number;
  label: string;
  target_path: string;
  sort_order: number;
}

export async function listShortcuts(): Promise<Shortcut[]> {
  const db = await getDb();
  return db.select<Shortcut[]>("SELECT * FROM shortcuts ORDER BY sort_order ASC, id ASC");
}

export async function createShortcut(input: { label: string; target_path: string }): Promise<void> {
  const db = await getDb();
  const [{ n }] = await db.select<{ n: number }[]>("SELECT COUNT(*) as n FROM shortcuts");
  await db.execute("INSERT INTO shortcuts (label, target_path, sort_order) VALUES ($1, $2, $3)", [
    input.label,
    input.target_path,
    n,
  ]);
}

export async function renameShortcut(id: number, label: string): Promise<void> {
  const db = await getDb();
  await db.execute("UPDATE shortcuts SET label = $1 WHERE id = $2", [label, id]);
}

export async function deleteShortcut(id: number): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM shortcuts WHERE id = $1", [id]);
}
