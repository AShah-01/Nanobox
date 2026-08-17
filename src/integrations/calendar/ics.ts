import { CalendarEvent } from "./types";
import { parseIcsDateTime } from "./icsDate";
import { expandRRule, parseRRule } from "./rrule";

interface IcsPropertyRef {
  value: string;
  params: Record<string, string>;
}

interface RawVEvent {
  uid?: string;
  summary?: string;
  location?: string;
  description?: string;
  dtstart?: IcsPropertyRef;
  dtend?: IcsPropertyRef;
  duration?: string;
  rrule?: string;
}

/** RFC 5545 line unfolding: a CRLF followed by a space/tab continues the previous line. */
function unfoldLines(text: string): string[] {
  const rawLines = text.split(/\r\n|\n|\r/);
  const lines: string[] = [];
  for (const line of rawLines) {
    if ((line.startsWith(" ") || line.startsWith("\t")) && lines.length > 0) {
      lines[lines.length - 1] += line.slice(1);
    } else {
      lines.push(line);
    }
  }
  return lines;
}

function parsePropertyLine(line: string): { name: string; params: Record<string, string>; value: string } | null {
  const colonIdx = line.indexOf(":");
  if (colonIdx === -1) return null;
  const head = line.slice(0, colonIdx);
  const value = line.slice(colonIdx + 1);
  const [name, ...paramParts] = head.split(";");
  const params: Record<string, string> = {};
  for (const p of paramParts) {
    const eq = p.indexOf("=");
    if (eq !== -1) params[p.slice(0, eq).toUpperCase()] = p.slice(eq + 1);
  }
  return { name: name.toUpperCase(), params, value };
}

function unescapeText(s: string): string {
  return s.replace(/\\n/gi, "\n").replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\\\/g, "\\");
}

function parseDurationMs(s: string): number {
  const m = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(s.trim());
  if (!m) return 0;
  const [, d, h, mi, sec] = m;
  return ((Number(d) || 0) * 86400 + (Number(h) || 0) * 3600 + (Number(mi) || 0) * 60 + (Number(sec) || 0)) * 1000;
}

function eventsFromRaw(raw: RawVEvent, sourceId: number, rangeStart: Date, rangeEnd: Date): CalendarEvent[] {
  if (!raw.dtstart) return [];
  const { date: startDate, allDay } = parseIcsDateTime(raw.dtstart.value, raw.dtstart.params.VALUE === "DATE");

  let durationMs: number;
  if (raw.dtend) {
    const { date: endDate } = parseIcsDateTime(raw.dtend.value, raw.dtend.params.VALUE === "DATE");
    durationMs = Math.max(0, endDate.getTime() - startDate.getTime());
  } else if (raw.duration) {
    durationMs = parseDurationMs(raw.duration);
  } else {
    durationMs = allDay ? 86_400_000 : 3_600_000;
  }

  const title = raw.summary || "(untitled)";
  const uidPart = raw.uid ?? title;

  function toEvent(occurrenceStart: Date): CalendarEvent {
    const end = new Date(occurrenceStart.getTime() + durationMs);
    return {
      id: `${sourceId}:${uidPart}:${occurrenceStart.toISOString()}`,
      sourceId,
      title,
      start: occurrenceStart.toISOString(),
      end: end.toISOString(),
      allDay,
      location: raw.location,
      description: raw.description,
    };
  }

  if (raw.rrule) {
    const rule = parseRRule(raw.rrule);
    if (rule) {
      return expandRRule(rule, startDate, rangeStart, rangeEnd).map(toEvent);
    }
    // Unsupported RRULE shape (see rrule.ts) — fall through to a single occurrence.
  }

  const singleEnd = new Date(startDate.getTime() + durationMs);
  if (singleEnd < rangeStart || startDate > rangeEnd) return [];
  return [toEvent(startDate)];
}

/**
 * Parses a raw .ics file's VEVENTs into unified CalendarEvent[], expanding
 * any (supported) RRULE recurrences that fall within [rangeStart, rangeEnd].
 */
export function parseIcs(text: string, sourceId: number, rangeStart: Date, rangeEnd: Date): CalendarEvent[] {
  const lines = unfoldLines(text);
  const events: CalendarEvent[] = [];
  let current: RawVEvent | null = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (line === "BEGIN:VEVENT") {
      current = {};
      continue;
    }
    if (line === "END:VEVENT") {
      if (current) events.push(...eventsFromRaw(current, sourceId, rangeStart, rangeEnd));
      current = null;
      continue;
    }
    if (!current) continue;

    const parsed = parsePropertyLine(line);
    if (!parsed) continue;
    switch (parsed.name) {
      case "UID":
        current.uid = parsed.value;
        break;
      case "SUMMARY":
        current.summary = unescapeText(parsed.value);
        break;
      case "LOCATION":
        current.location = unescapeText(parsed.value);
        break;
      case "DESCRIPTION":
        current.description = unescapeText(parsed.value);
        break;
      case "DTSTART":
        current.dtstart = { value: parsed.value, params: parsed.params };
        break;
      case "DTEND":
        current.dtend = { value: parsed.value, params: parsed.params };
        break;
      case "DURATION":
        current.duration = parsed.value;
        break;
      case "RRULE":
        current.rrule = parsed.value;
        break;
    }
  }

  return events.sort((a, b) => a.start.localeCompare(b.start));
}
