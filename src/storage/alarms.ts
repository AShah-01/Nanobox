import { getDb } from "./db";

export type AlarmSound = "chime" | "beep" | "digital";

export interface Alarm {
  id: number;
  label: string;
  /** "HH:MM", 24hr, local time */
  time: string;
  /** comma-separated weekday abbreviations, e.g. "Mon,Wed,Fri"; empty = one-off/every day depending on UI, we treat empty as "every day" */
  days: string;
  sound: AlarmSound;
  enabled: boolean;
  snoozed_until: string | null;
  last_fired_on: string | null;
}

interface AlarmRow extends Omit<Alarm, "enabled" | "sound"> {
  enabled: number;
  sound: string;
}

const fromRow = (row: AlarmRow): Alarm => ({
  ...row,
  enabled: Boolean(row.enabled),
  sound: row.sound as AlarmSound,
});

export async function listAlarms(): Promise<Alarm[]> {
  const db = await getDb();
  const rows = await db.select<AlarmRow[]>("SELECT * FROM alarms ORDER BY time ASC");
  return rows.map(fromRow);
}

export async function createAlarm(input: {
  label: string;
  time: string;
  days: string;
  sound: AlarmSound;
}): Promise<void> {
  const db = await getDb();
  await db.execute("INSERT INTO alarms (label, time, days, sound) VALUES ($1, $2, $3, $4)", [
    input.label,
    input.time,
    input.days,
    input.sound,
  ]);
}

export async function deleteAlarm(id: number): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM alarms WHERE id = $1", [id]);
}

export async function setAlarmEnabled(id: number, enabled: boolean): Promise<void> {
  const db = await getDb();
  await db.execute("UPDATE alarms SET enabled = $1 WHERE id = $2", [enabled ? 1 : 0, id]);
}

export async function snoozeAlarm(id: number, untilIso: string): Promise<void> {
  const db = await getDb();
  await db.execute("UPDATE alarms SET snoozed_until = $1 WHERE id = $2", [untilIso, id]);
}

export async function markAlarmFired(id: number, dateStr: string): Promise<void> {
  const db = await getDb();
  await db.execute("UPDATE alarms SET last_fired_on = $1, snoozed_until = NULL WHERE id = $2", [dateStr, id]);
}
