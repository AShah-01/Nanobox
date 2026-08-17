import { describe, expect, it } from "vitest";
import { expandRRule, parseRRule } from "../../src/integrations/calendar/rrule";

describe("parseRRule", () => {
  it("parses FREQ/INTERVAL/COUNT", () => {
    const rule = parseRRule("FREQ=WEEKLY;INTERVAL=2;COUNT=4");
    expect(rule).toEqual({ freq: "WEEKLY", interval: 2, count: 4, until: undefined });
  });

  it("returns null for unsupported BYDAY-style rules rather than guessing", () => {
    expect(parseRRule("FREQ=WEEKLY;BYDAY=MO,WE,FR")).toBeNull();
  });

  it("returns null for an unrecognised FREQ", () => {
    expect(parseRRule("FREQ=SECONDLY")).toBeNull();
  });
});

describe("expandRRule", () => {
  it("steps DAILY occurrences by INTERVAL, capped at COUNT", () => {
    const rule = parseRRule("FREQ=DAILY;INTERVAL=2;COUNT=3")!;
    const dtstart = new Date("2026-01-01T09:00:00");
    // rangeStart must be constructed the same way as dtstart (local time) —
    // a bare "2026-01-01" string parses as UTC midnight, which in a
    // timezone ahead of UTC falls *after* 09:00 local on Jan 1 and silently
    // drops the first occurrence. Real bug this test exists to catch.
    const occurrences = expandRRule(rule, dtstart, new Date("2026-01-01T00:00:00"), new Date("2026-01-31"));

    expect(occurrences.map((d) => d.getDate())).toEqual([1, 3, 5]);
  });

  it("stops at UNTIL even if COUNT would allow more", () => {
    const rule = parseRRule("FREQ=DAILY;UNTIL=20260105T000000")!;
    const dtstart = new Date("2026-01-01T09:00:00");
    const occurrences = expandRRule(rule, dtstart, new Date("2026-01-01T00:00:00"), new Date("2026-01-31"));

    expect(occurrences).toHaveLength(4);
  });

  it("only returns occurrences intersecting the requested range", () => {
    const rule = parseRRule("FREQ=WEEKLY;COUNT=10")!;
    const dtstart = new Date("2026-01-01T09:00:00");
    const occurrences = expandRRule(rule, dtstart, new Date("2026-02-01"), new Date("2026-02-28"));

    expect(occurrences.every((d) => d >= new Date("2026-02-01") && d <= new Date("2026-02-28"))).toBe(true);
    expect(occurrences.length).toBeGreaterThan(0);
  });
});
