import { describe, expect, it } from "vitest";
import { parseIcs } from "../../src/integrations/calendar/ics";

const RANGE_START = new Date("2026-01-01T00:00:00");
const RANGE_END = new Date("2026-03-31T23:59:59");

describe("parseIcs", () => {
  it("parses a single timed VEVENT", () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "UID:abc-123",
      "SUMMARY:Team sync",
      "LOCATION:Room 4",
      "DTSTART:20260115T090000",
      "DTEND:20260115T093000",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const events = parseIcs(ics, 1, RANGE_START, RANGE_END);

    expect(events).toHaveLength(1);
    expect(events[0].title).toBe("Team sync");
    expect(events[0].location).toBe("Room 4");
    expect(events[0].allDay).toBe(false);
    expect(new Date(events[0].start).getHours()).toBe(9);
  });

  it("parses an all-day VEVENT with a DATE-only DTSTART/DTEND", () => {
    const ics = ["BEGIN:VEVENT", "SUMMARY:Conference", "DTSTART;VALUE=DATE:20260210", "DTEND;VALUE=DATE:20260212", "END:VEVENT"].join(
      "\r\n",
    );

    const events = parseIcs(ics, 1, RANGE_START, RANGE_END);

    expect(events).toHaveLength(1);
    expect(events[0].allDay).toBe(true);
    const durationDays = (new Date(events[0].end).getTime() - new Date(events[0].start).getTime()) / 86_400_000;
    expect(durationDays).toBe(2);
  });

  it("expands a DAILY RRULE with COUNT into that many occurrences", () => {
    const ics = [
      "BEGIN:VEVENT",
      "UID:daily-1",
      "SUMMARY:Standup",
      "DTSTART:20260105T090000",
      "DTEND:20260105T091500",
      "RRULE:FREQ=DAILY;COUNT=5",
      "END:VEVENT",
    ].join("\r\n");

    const events = parseIcs(ics, 1, RANGE_START, RANGE_END);

    expect(events).toHaveLength(5);
    expect(events.every((e) => e.title === "Standup")).toBe(true);
    // 15-minute duration preserved on every occurrence
    for (const e of events) {
      expect(new Date(e.end).getTime() - new Date(e.start).getTime()).toBe(15 * 60_000);
    }
  });

  it("unfolds RFC 5545 folded lines before parsing", () => {
    const ics = ["BEGIN:VEVENT", "SUMMARY:Long meeting na\r\n me that wraps", "DTSTART:20260120T100000", "END:VEVENT"].join("\r\n");

    const events = parseIcs(ics, 1, RANGE_START, RANGE_END);

    expect(events[0].title).toBe("Long meeting name that wraps");
  });

  it("ignores non-VEVENT content and handles an empty file", () => {
    expect(parseIcs("BEGIN:VCALENDAR\r\nEND:VCALENDAR", 1, RANGE_START, RANGE_END)).toEqual([]);
    expect(parseIcs("", 1, RANGE_START, RANGE_END)).toEqual([]);
  });
});
