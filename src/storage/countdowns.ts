import { getDb } from "./db";

export interface Countdown {
  id: number;
  label: string;
  /** ISO date string */
  target_date: string;
}

export async function listCountdowns(): Promise<Countdown[]> {
  const db = await getDb();
  return db.select<Countdown[]>("SELECT * FROM countdowns ORDER BY target_date ASC");
}

export async function createCountdown(input: { label: string; target_date: string }): Promise<void> {
  const db = await getDb();
  await db.execute("INSERT INTO countdowns (label, target_date) VALUES ($1, $2)", [input.label, input.target_date]);
}

export async function deleteCountdown(id: number): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM countdowns WHERE id = $1", [id]);
}
