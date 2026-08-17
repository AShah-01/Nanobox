import { getDb } from "./db";

export interface MoodLog {
  id: number;
  mood: string;
  note: string;
  log_date: string;
}

export async function listRecentMoodLogs(days: number): Promise<MoodLog[]> {
  const db = await getDb();
  return db.select<MoodLog[]>("SELECT * FROM mood_logs WHERE log_date >= date('now', $1) ORDER BY log_date ASC", [
    `-${days} days`,
  ]);
}

export async function logMood(todayIso: string, mood: string, note: string): Promise<void> {
  const db = await getDb();
  await db.execute(
    "INSERT INTO mood_logs (mood, note, log_date) VALUES ($1, $2, $3) ON CONFLICT(log_date) DO UPDATE SET mood = $1, note = $2",
    [mood, note, todayIso],
  );
}
