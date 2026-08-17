import { getDb } from "./db";

export interface Reminder {
  id: number;
  label: string;
  interval_minutes: number;
  enabled: boolean;
  last_fired_at: string | null;
}

interface ReminderRow extends Omit<Reminder, "enabled"> {
  enabled: number;
}

const fromRow = (row: ReminderRow): Reminder => ({ ...row, enabled: Boolean(row.enabled) });

export async function listReminders(): Promise<Reminder[]> {
  const db = await getDb();
  const rows = await db.select<ReminderRow[]>("SELECT * FROM reminders ORDER BY id ASC");
  return rows.map(fromRow);
}

export async function createReminder(label: string, intervalMinutes: number): Promise<void> {
  const db = await getDb();
  await db.execute("INSERT INTO reminders (label, interval_minutes) VALUES ($1, $2)", [label, intervalMinutes]);
}

export async function setReminderEnabled(id: number, enabled: boolean): Promise<void> {
  const db = await getDb();
  await db.execute("UPDATE reminders SET enabled = $1 WHERE id = $2", [enabled ? 1 : 0, id]);
}

export async function markReminderFired(id: number, iso: string): Promise<void> {
  const db = await getDb();
  await db.execute("UPDATE reminders SET last_fired_at = $1 WHERE id = $2", [iso, id]);
}

export async function deleteReminder(id: number): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM reminders WHERE id = $1", [id]);
}
