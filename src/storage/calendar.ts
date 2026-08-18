import { getDb } from "./db";
import { CalendarEvent, CalendarSource, CalendarSourceKind } from "../integrations/calendar/types";

export async function listCalendarSources(): Promise<CalendarSource[]> {
  const db = await getDb();
  return db.select<CalendarSource[]>("SELECT * FROM calendar_sources ORDER BY created_at ASC");
}

export async function createCalendarSource(input: {
  kind: CalendarSourceKind;
  name: string;
  file_path?: string | null;
  account_email?: string | null;
  color?: string;
}): Promise<number> {
  const db = await getDb();
  const result = await db.execute(
    "INSERT INTO calendar_sources (kind, name, file_path, account_email, color) VALUES ($1, $2, $3, $4, $5)",
    [input.kind, input.name, input.file_path ?? null, input.account_email ?? null, input.color ?? "#7c9cff"],
  );
  return result.lastInsertId as number;
}

export async function deleteCalendarSource(id: number): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM calendar_sources WHERE id = $1", [id]);
}

/**
 * Last-known-good cache for graceful degradation: one row per source,
 * replaced wholesale on every successful fetch. When a live fetch fails
 * (Google API down, ics file moved, offline), the widget falls back to
 * whatever's here rather than showing nothing.
 */
export async function cacheCalendarEvents(sourceId: number, events: CalendarEvent[]): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM calendar_events_cache WHERE source_id = $1", [sourceId]);
  await db.execute("INSERT INTO calendar_events_cache (source_id, event_json) VALUES ($1, $2)", [
    sourceId,
    JSON.stringify(events),
  ]);
}

interface CacheRow {
  event_json: string;
  cached_at: string;
}

export async function getCachedCalendarEvents(
  sourceId: number,
): Promise<{ events: CalendarEvent[]; cachedAt: string } | null> {
  const db = await getDb();
  const rows = await db.select<CacheRow[]>(
    "SELECT event_json, cached_at FROM calendar_events_cache WHERE source_id = $1 ORDER BY cached_at DESC LIMIT 1",
    [sourceId],
  );
  if (!rows[0]) return null;
  return { events: JSON.parse(rows[0].event_json), cachedAt: rows[0].cached_at };
}

const LOCAL_SOURCE_NAME = "My Events";

/**
 * Local, manually-added events (quick-add) live under a single synthetic
 * "local" source — same tables as .ics/Google, just never fetched from the
 * network, so `refresh()` in the widget reads it straight from cache.
 */
export async function getOrCreateLocalSource(color: string): Promise<CalendarSource> {
  const db = await getDb();
  const existing = await db.select<CalendarSource[]>(
    "SELECT * FROM calendar_sources WHERE kind = 'local' LIMIT 1",
  );
  if (existing[0]) return existing[0];

  const id = await createCalendarSource({ kind: "local", name: LOCAL_SOURCE_NAME, color });
  return { id, kind: "local", name: LOCAL_SOURCE_NAME, file_path: null, account_email: null, color };
}

export async function addLocalEvent(sourceId: number, event: CalendarEvent): Promise<void> {
  const cached = await getCachedCalendarEvents(sourceId);
  const events = [...(cached?.events ?? []), event];
  await cacheCalendarEvents(sourceId, events);
}

export async function deleteLocalEvent(sourceId: number, eventId: string): Promise<void> {
  const cached = await getCachedCalendarEvents(sourceId);
  if (!cached) return;
  await cacheCalendarEvents(sourceId, cached.events.filter((e) => e.id !== eventId));
}
