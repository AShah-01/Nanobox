import { getDb } from "./db";

export interface Habit {
  id: number;
  name: string;
  color: string;
  sort_order: number;
}

export interface HabitLog {
  habit_id: number;
  log_date: string;
}

export async function listHabits(): Promise<Habit[]> {
  const db = await getDb();
  return db.select<Habit[]>("SELECT * FROM habits ORDER BY sort_order ASC, id ASC");
}

/** Logs from the last `days` days (including today), across all habits. */
export async function listRecentLogs(days: number): Promise<HabitLog[]> {
  const db = await getDb();
  return db.select<HabitLog[]>(
    "SELECT habit_id, log_date FROM habit_logs WHERE completed = 1 AND log_date >= date('now', $1)",
    [`-${days} days`],
  );
}

export async function createHabit(input: { name: string; color: string }): Promise<void> {
  const db = await getDb();
  const [{ n }] = await db.select<{ n: number }[]>("SELECT COUNT(*) as n FROM habits");
  await db.execute("INSERT INTO habits (name, color, sort_order) VALUES ($1, $2, $3)", [input.name, input.color, n]);
}

export async function deleteHabit(id: number): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM habits WHERE id = $1", [id]);
}

/** Toggles today's completion for a habit. */
export async function toggleHabitToday(habitId: number, todayIso: string, completed: boolean): Promise<void> {
  const db = await getDb();
  if (completed) {
    await db.execute(
      "INSERT INTO habit_logs (habit_id, log_date, completed) VALUES ($1, $2, 1) ON CONFLICT(habit_id, log_date) DO UPDATE SET completed = 1",
      [habitId, todayIso],
    );
  } else {
    await db.execute("DELETE FROM habit_logs WHERE habit_id = $1 AND log_date = $2", [habitId, todayIso]);
  }
}

/** Consecutive-day streak ending today (or yesterday, if today isn't logged yet), from an already-fetched log set. */
export function computeStreak(habitId: number, logs: HabitLog[], today: Date): number {
  const completedDates = new Set(logs.filter((l) => l.habit_id === habitId).map((l) => l.log_date));
  const toIso = (d: Date) => d.toISOString().slice(0, 10);

  let streak = 0;
  const cursor = new Date(today);
  if (!completedDates.has(toIso(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (completedDates.has(toIso(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
