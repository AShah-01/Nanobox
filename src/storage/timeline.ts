import { getDb } from "./db";

export interface TimelineBlock {
  id: number;
  label: string;
  icon: string;
  color: string;
  /** "HH:MM", 24hr */
  start_time: string;
  end_time: string;
}

export async function listTimelineBlocks(): Promise<TimelineBlock[]> {
  const db = await getDb();
  return db.select<TimelineBlock[]>("SELECT * FROM timeline_blocks ORDER BY start_time ASC");
}

export async function createTimelineBlock(input: Omit<TimelineBlock, "id">): Promise<void> {
  const db = await getDb();
  await db.execute("INSERT INTO timeline_blocks (label, icon, color, start_time, end_time) VALUES ($1, $2, $3, $4, $5)", [
    input.label,
    input.icon,
    input.color,
    input.start_time,
    input.end_time,
  ]);
}

export async function deleteTimelineBlock(id: number): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM timeline_blocks WHERE id = $1", [id]);
}
