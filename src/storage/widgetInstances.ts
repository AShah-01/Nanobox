import { getDb } from "./db";
import type { WidgetId } from "../widgets/registry";

export interface WidgetInstance {
  id: number;
  widget_type: WidgetId;
  x: number;
  y: number;
  w: number;
  h: number;
  opacity: number;
  /** Free-form per-instance JSON blob. Only the Custom Widget type uses this today (its html/css/js). */
  settings: string | null;
  /** JSON: { color?: string; borderStyle?: BorderStyleId } — per-instance appearance override, any widget type. */
  style_settings: string | null;
}

interface WidgetInstanceRow extends Omit<WidgetInstance, "widget_type"> {
  widget_type: string;
}

const fromRow = (row: WidgetInstanceRow): WidgetInstance => ({ ...row, widget_type: row.widget_type as WidgetId });

export async function listWidgetInstances(): Promise<WidgetInstance[]> {
  const db = await getDb();
  const rows = await db.select<WidgetInstanceRow[]>("SELECT * FROM widget_instances ORDER BY id ASC");
  return rows.map(fromRow);
}

export async function createWidgetInstance(input: {
  widget_type: WidgetId;
  x: number;
  y: number;
  w: number;
  h: number;
}): Promise<number> {
  const db = await getDb();
  const result = await db.execute("INSERT INTO widget_instances (widget_type, x, y, w, h) VALUES ($1, $2, $3, $4, $5)", [
    input.widget_type,
    input.x,
    input.y,
    input.w,
    input.h,
  ]);
  return result.lastInsertId as number;
}

export async function updateWidgetLayout(id: number, layout: { x: number; y: number; w: number; h: number }): Promise<void> {
  const db = await getDb();
  await db.execute("UPDATE widget_instances SET x = $1, y = $2, w = $3, h = $4 WHERE id = $5", [
    layout.x,
    layout.y,
    layout.w,
    layout.h,
    id,
  ]);
}

export async function updateWidgetOpacity(id: number, opacity: number): Promise<void> {
  const db = await getDb();
  await db.execute("UPDATE widget_instances SET opacity = $1 WHERE id = $2", [opacity, id]);
}

export async function updateWidgetSettings(id: number, settings: string): Promise<void> {
  const db = await getDb();
  await db.execute("UPDATE widget_instances SET settings = $1 WHERE id = $2", [settings, id]);
}

export async function updateWidgetStyle(id: number, styleSettings: string | null): Promise<void> {
  const db = await getDb();
  await db.execute("UPDATE widget_instances SET style_settings = $1 WHERE id = $2", [styleSettings, id]);
}

export async function deleteWidgetInstance(id: number): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM widget_instances WHERE id = $1", [id]);
}
