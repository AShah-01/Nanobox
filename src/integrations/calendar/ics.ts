export interface ParsedIcsEvent {
  uid: string | null;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
}

/**
 * Minimal RFC 5545 subset: unfolds continuation lines, reads VEVENT
 * SUMMARY/DTSTART/DTEND/UID. Deliberately does not expand RRULE recurrence
 * or convert TZID-qualified times to the local zone — both are real gaps,
 * documented in PROGRESS.md/ROADMAP.md rather than silently producing wrong
 * data. Good enough for "import my calendar export and see the events."
 */
export function parseIcs(raw: string): ParsedIcsEvent[] {
  const unfolded = raw.replace(/\r\n/g, "\n").replace(/\n[ \t]/g, "");
  const lines = unfolded.split("\n");

  const events: ParsedIcsEvent[] = [];
  let inEvent = false;
  let uid: string | null = null;
  let title = "";
  let start: { iso: string; allDay: boolean } | null = null;
  let end: { iso: string; allDay: boolean } | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line === "BEGIN:VEVENT") {
      inEvent = true;
      uid = null;
      title = "";
      start = null;
      end = null;
      continue;
    }
    if (line === "END:VEVENT") {
      if (inEvent && start) {
        const resolvedEnd = end ?? {
          iso: addDuration(start.iso, start.allDay ? 24 * 60 : 60),
          allDay: start.allDay,
        };
        events.push({ uid, title: title || "(untitled event)", start: start.iso, end: resolvedEnd.iso, allDay: start.allDay });
      }
      inEvent = false;
      continue;
    }
    if (!inEvent) continue;

    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;
    const keyPart = line.slice(0, colonIndex);
    const value = line.slice(colonIndex + 1);
    const key = keyPart.split(";")[0];

    if (key === "UID") uid = value;
    else if (key === "SUMMARY") title = unescapeText(value);
    else if (key === "DTSTART") start = parseIcsDate(keyPart, value);
    else if (key === "DTEND") end = parseIcsDate(keyPart, value);
  }

  return events;
}

function unescapeText(value: string): string {
  return value.replace(/\\n/gi, " ").replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\\\/g, "\\");
}

function parseIcsDate(keyPart: string, value: string): { iso: string; allDay: boolean } {
  const isDateOnly = keyPart.includes("VALUE=DATE") || /^\d{8}$/.test(value);

  if (isDateOnly) {
    const y = value.slice(0, 4);
    const m = value.slice(4, 6);
    const d = value.slice(6, 8);
    return { iso: `${y}-${m}-${d}T00:00:00.000Z`, allDay: true };
  }

  // YYYYMMDDTHHMMSS or YYYYMMDDTHHMMSSZ
  const match = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/);
  if (!match) return { iso: new Date().toISOString(), allDay: false };
  const [, y, mo, d, h, mi, s, z] = match;
  const iso = z
    ? new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s)).toISOString()
    : new Date(+y, +mo - 1, +d, +h, +mi, +s).toISOString();
  return { iso, allDay: false };
}

function addDuration(startIso: string, minutes: number): string {
  return new Date(new Date(startIso).getTime() + minutes * 60_000).toISOString();
}
