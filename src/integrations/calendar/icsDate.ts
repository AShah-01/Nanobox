export interface ParsedIcsDate {
  date: Date;
  allDay: boolean;
}

/**
 * Parses an iCalendar DATE ("20260115") or DATE-TIME ("20260115T090000Z" /
 * "20260115T090000") value. TZID-qualified datetimes (no trailing Z) are
 * treated as local wall-clock time — there's no bundled IANA timezone
 * database, so a `DTSTART;TZID=America/New_York:...` event will display at
 * the wrong clock time for viewers outside that zone. Documented limitation,
 * not silently wrong: the common cases (UTC "Z" times, all-day dates, and
 * events created in the viewer's own timezone) all parse correctly.
 */
export function parseIcsDateTime(value: string, isDateOnly: boolean): ParsedIcsDate {
  const clean = value.trim();
  if (isDateOnly || !clean.includes("T")) {
    const y = Number(clean.slice(0, 4));
    const mo = Number(clean.slice(4, 6)) - 1;
    const d = Number(clean.slice(6, 8));
    return { date: new Date(y, mo, d), allDay: true };
  }
  const isUtc = clean.endsWith("Z");
  const y = Number(clean.slice(0, 4));
  const mo = Number(clean.slice(4, 6)) - 1;
  const d = Number(clean.slice(6, 8));
  const h = Number(clean.slice(9, 11));
  const mi = Number(clean.slice(11, 13));
  const s = Number(clean.slice(13, 15)) || 0;
  const date = isUtc ? new Date(Date.UTC(y, mo, d, h, mi, s)) : new Date(y, mo, d, h, mi, s);
  return { date, allDay: false };
}
