import { useEffect, useMemo, useState } from "react";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { WidgetFrame } from "../../../components/WidgetFrame";
import { CalendarEvent } from "../../../integrations/calendar/types";
import { parseIcs } from "../../../integrations/calendar/ics";
import { importIcsEvents, listEventsInRange } from "../../../storage/calendarEvents";
import "./Calendar.css";

type ViewMode = "day" | "week" | "month";

function startOfDay(d: Date) {
  const n = new Date(d);
  n.setHours(0, 0, 0, 0);
  return n;
}
function addDays(d: Date, n: number) {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}
function startOfWeek(d: Date) {
  return addDays(startOfDay(d), -d.getDay());
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}
function sameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

export function Calendar() {
  const [view, setView] = useState<ViewMode>("day");
  const [cursor, setCursor] = useState(() => new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  const range = useMemo(() => {
    if (view === "day") return { from: startOfDay(cursor), to: addDays(startOfDay(cursor), 1) };
    if (view === "week") return { from: startOfWeek(cursor), to: addDays(startOfWeek(cursor), 7) };
    return { from: startOfMonth(cursor), to: endOfMonth(cursor) };
  }, [view, cursor]);

  async function refresh() {
    const list = await listEventsInRange(range.from.toISOString(), range.to.toISOString());
    setEvents(list);
  }

  useEffect(() => {
    refresh().catch((err) => console.error("failed to load calendar events", err));
  }, [range.from.getTime(), range.to.getTime()]);

  async function importIcs() {
    const path = await openDialog({ filters: [{ name: "iCalendar", extensions: ["ics"] }] });
    if (!path || Array.isArray(path)) return;
    setImporting(true);
    setImportMessage(null);
    try {
      const text = await invoke<string>("read_text_file", { path });
      const parsed = parseIcs(text);
      const count = await importIcsEvents(parsed);
      setImportMessage(`Imported ${count} new event${count === 1 ? "" : "s"} (${parsed.length} found in file).`);
      await refresh();
    } catch (err) {
      console.error("failed to import .ics file", err);
      setImportMessage("Couldn't read that file — is it a valid .ics export?");
    } finally {
      setImporting(false);
    }
  }

  function step(dir: 1 | -1) {
    if (view === "day") setCursor((c) => addDays(c, dir));
    else if (view === "week") setCursor((c) => addDays(c, dir * 7));
    else setCursor((c) => new Date(c.getFullYear(), c.getMonth() + dir, 1));
  }

  return (
    <WidgetFrame title="Calendar">
      <div className="calendar-widget">
        <div className="calendar-widget__toolbar">
          <div className="calendar-widget__view-toggle">
            {(["day", "week", "month"] as ViewMode[]).map((v) => (
              <button key={v} className={view === v ? "is-active" : ""} onClick={() => setView(v)}>
                {v[0].toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
          <div className="calendar-widget__nav">
            <button onClick={() => step(-1)} aria-label="Previous">
              ‹
            </button>
            <button onClick={() => setCursor(new Date())}>Today</button>
            <button onClick={() => step(1)} aria-label="Next">
              ›
            </button>
          </div>
        </div>

        {view === "day" && <DayView date={cursor} events={events} />}
        {view === "week" && <WeekView weekStart={startOfWeek(cursor)} events={events} onPickDay={(d) => (setCursor(d), setView("day"))} />}
        {view === "month" && (
          <MonthView month={cursor} events={events} onPickDay={(d) => (setCursor(d), setView("day"))} />
        )}

        <div className="calendar-widget__footer">
          <button className="calendar-widget__import" onClick={importIcs} disabled={importing}>
            {importing ? "Importing…" : "+ Import .ics file"}
          </button>
          {importMessage && <p className="calendar-widget__message">{importMessage}</p>}
        </div>
      </div>
    </WidgetFrame>
  );
}

function DayView({ date, events }: { date: Date; events: CalendarEvent[] }) {
  const dayEvents = events
    .filter((e) => sameDay(new Date(e.start), date))
    .sort((a, b) => a.start.localeCompare(b.start));
  return (
    <div className="calendar-widget__day">
      <div className="calendar-widget__day-title">
        {date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
      </div>
      <ul className="calendar-widget__agenda">
        {dayEvents.map((e) => (
          <li key={e.id}>
            <span className="calendar-widget__event-time">
              {e.allDay ? "All day" : new Date(e.start).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
            </span>
            <span className="calendar-widget__event-title">{e.title}</span>
          </li>
        ))}
        {dayEvents.length === 0 && <li className="calendar-widget__empty">Nothing on the calendar.</li>}
      </ul>
    </div>
  );
}

function WeekView({
  weekStart,
  events,
  onPickDay,
}: {
  weekStart: Date;
  events: CalendarEvent[];
  onPickDay: (d: Date) => void;
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  return (
    <ul className="calendar-widget__week">
      {days.map((d) => {
        const dayEvents = events.filter((e) => sameDay(new Date(e.start), d));
        const isToday = sameDay(d, new Date());
        return (
          <li key={d.toISOString()} className={isToday ? "is-today" : ""} onClick={() => onPickDay(d)}>
            <span className="calendar-widget__week-day">{d.toLocaleDateString(undefined, { weekday: "short" })}</span>
            <span className="calendar-widget__week-date">{d.getDate()}</span>
            <span className="calendar-widget__week-count">{dayEvents.length > 0 ? dayEvents.length : ""}</span>
          </li>
        );
      })}
    </ul>
  );
}

function MonthView({
  month,
  events,
  onPickDay,
}: {
  month: Date;
  events: CalendarEvent[];
  onPickDay: (d: Date) => void;
}) {
  const first = startOfMonth(month);
  const leading = first.getDay();
  const daysInMonth = endOfMonth(month).getDate();
  const cells = Array.from({ length: leading + daysInMonth }, (_, i) =>
    i < leading ? null : new Date(month.getFullYear(), month.getMonth(), i - leading + 1),
  );

  return (
    <div className="calendar-widget__month">
      <div className="calendar-widget__month-title">{month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</div>
      <div className="calendar-widget__month-grid">
        {cells.map((d, i) => {
          if (!d) return <span key={i} className="calendar-widget__month-cell is-empty" />;
          const hasEvents = events.some((e) => sameDay(new Date(e.start), d));
          const isToday = sameDay(d, new Date());
          return (
            <button
              key={i}
              className={`calendar-widget__month-cell ${isToday ? "is-today" : ""}`}
              onClick={() => onPickDay(d)}
            >
              {d.getDate()}
              {hasEvents && <span className="calendar-widget__month-dot" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
