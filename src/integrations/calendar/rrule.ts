import { parseIcsDateTime } from "./icsDate";

export interface RRule {
  freq: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  interval: number;
  count?: number;
  until?: Date;
}

/**
 * Parses the subset of RFC 5545 RRULE actually needed for a desktop-widget
 * calendar view: FREQ, INTERVAL, COUNT, UNTIL. Deliberately does not support
 * BYDAY/BYMONTHDAY/BYSETPOS and similar sub-selectors (e.g. "every Mon/Wed/
 * Fri", "last Friday of the month") — those cover a long tail of patterns
 * that would take a proper recurrence-rule library to do correctly, and a
 * naive implementation would silently produce wrong occurrences, which is
 * worse than the plain "every N days/weeks/months/years" case this
 * supports. Unsupported rules return null and the event falls back to a
 * single (non-repeating) occurrence at DTSTART.
 */
export function parseRRule(value: string): RRule | null {
  const parts: Record<string, string> = {};
  for (const pair of value.split(";")) {
    const [k, v] = pair.split("=");
    if (k && v) parts[k.toUpperCase()] = v;
  }
  const freq = parts.FREQ;
  if (freq !== "DAILY" && freq !== "WEEKLY" && freq !== "MONTHLY" && freq !== "YEARLY") return null;
  if (parts.BYDAY || parts.BYMONTHDAY || parts.BYSETPOS || parts.BYMONTH) return null;

  return {
    freq,
    interval: parts.INTERVAL ? Math.max(1, parseInt(parts.INTERVAL, 10)) : 1,
    count: parts.COUNT ? parseInt(parts.COUNT, 10) : undefined,
    until: parts.UNTIL ? parseIcsDateTime(parts.UNTIL, false).date : undefined,
  };
}

function step(d: Date, rule: RRule): Date {
  const next = new Date(d);
  switch (rule.freq) {
    case "DAILY":
      next.setDate(next.getDate() + rule.interval);
      break;
    case "WEEKLY":
      next.setDate(next.getDate() + 7 * rule.interval);
      break;
    case "MONTHLY":
      next.setMonth(next.getMonth() + rule.interval);
      break;
    case "YEARLY":
      next.setFullYear(next.getFullYear() + rule.interval);
      break;
  }
  return next;
}

/** Expands occurrence start times intersecting [rangeStart, rangeEnd], capped at maxOccurrences. */
export function expandRRule(rule: RRule, dtstart: Date, rangeStart: Date, rangeEnd: Date, maxOccurrences = 730): Date[] {
  const results: Date[] = [];
  const hardStop = rule.until ?? rangeEnd;
  let cur = dtstart;

  for (let i = 0; i < maxOccurrences; i++) {
    if (cur > hardStop) break;
    if (rule.count !== undefined && i >= rule.count) break;
    if (cur >= rangeStart && cur <= rangeEnd) results.push(cur);
    if (cur > rangeEnd) break;
    cur = step(cur, rule);
  }
  return results;
}
