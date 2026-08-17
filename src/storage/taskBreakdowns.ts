import { getDb } from "./db";

export interface TaskBreakdown {
  id: number;
  title: string;
}

export interface TaskBreakdownStep {
  id: number;
  breakdown_id: number;
  text: string;
  completed: boolean;
  sort_order: number;
}

interface StepRow extends Omit<TaskBreakdownStep, "completed"> {
  completed: number;
}

const fromRow = (row: StepRow): TaskBreakdownStep => ({ ...row, completed: Boolean(row.completed) });

export async function listBreakdowns(): Promise<TaskBreakdown[]> {
  const db = await getDb();
  return db.select<TaskBreakdown[]>("SELECT * FROM task_breakdowns ORDER BY created_at DESC");
}

export async function listSteps(): Promise<TaskBreakdownStep[]> {
  const db = await getDb();
  const rows = await db.select<StepRow[]>("SELECT * FROM task_breakdown_steps ORDER BY sort_order ASC, id ASC");
  return rows.map(fromRow);
}

export async function createBreakdown(title: string): Promise<void> {
  const db = await getDb();
  await db.execute("INSERT INTO task_breakdowns (title) VALUES ($1)", [title]);
}

export async function deleteBreakdown(id: number): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM task_breakdowns WHERE id = $1", [id]);
}

export async function addStep(breakdownId: number, text: string): Promise<void> {
  const db = await getDb();
  const [{ n }] = await db.select<{ n: number }[]>("SELECT COUNT(*) as n FROM task_breakdown_steps WHERE breakdown_id = $1", [
    breakdownId,
  ]);
  await db.execute("INSERT INTO task_breakdown_steps (breakdown_id, text, sort_order) VALUES ($1, $2, $3)", [
    breakdownId,
    text,
    n,
  ]);
}

export async function toggleStep(id: number, completed: boolean): Promise<void> {
  const db = await getDb();
  await db.execute("UPDATE task_breakdown_steps SET completed = $1 WHERE id = $2", [completed ? 1 : 0, id]);
}

export async function deleteStep(id: number): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM task_breakdown_steps WHERE id = $1", [id]);
}
