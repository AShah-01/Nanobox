import { getDb } from "./db";
import { CalendarEvent } from "../integrations/calendar/types";
import { ParsedIcsEvent } from "../integrations/calendar/ics";

interface CalendarEventRow extends Omit<CalendarEvent, "start" | "end" | "allDay"> {
  start_at: string;
  end_at: string;
  all_day: number;
}

const fromRow = (row: CalendarEventRow): CalendarEvent => ({
  id: row.id,
  uid: row.uid,
  title: row.title,
  start: row.start_at,
  end: row.end_at,
  allDay: Boolean(row.all_day),
  source: row.source,
});

export async function listEventsInRange(fromIso: string, toIso: string): Promise<CalendarEvent[]> {
  const db = await getDb();
  const rows = await db.select<CalendarEventRow[]>(
    "SELECT * FROM calendar_events WHERE start_at < $2 AND end_at > $1 ORDER BY start_at ASC",
    [fromIso, toIso],
  );
  return rows.map(fromRow);
}

/** Inserts parsed .ics events, skipping ones already imported (same uid + start). */
export async function importIcsEvents(events: ParsedIcsEvent[]): Promise<number> {
  const db = await getDb();
  let imported = 0;
  for (const e of events) {
    const result = await db.execute(
      "INSERT OR IGNORE INTO calendar_events (uid, title, start_at, end_at, all_day, source) VALUES ($1, $2, $3, $4, $5, 'ics')",
      [e.uid, e.title, e.start, e.end, e.allDay ? 1 : 0],
    );
    if (result.rowsAffected > 0) imported += 1;
  }
  return imported;
}

export async function clearIcsEvents(): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM calendar_events WHERE source = 'ics'", []);
}
