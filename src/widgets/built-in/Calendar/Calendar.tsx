import { useEffect, useMemo, useState } from "react";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { WidgetFrame } from "../../../components/WidgetFrame";
import { CalendarEvent, CalendarSource } from "../../../integrations/calendar/types";
import { parseIcs } from "../../../integrations/calendar/ics";
import {
  connectGoogleCalendar,
  disconnectGoogleCalendar,
  fetchGoogleEvents,
  GOOGLE_REDIRECT_URI,
  isGoogleCalendarConnected,
} from "../../../integrations/calendar/google";
import { addDays, addMonths, startOfDay } from "../../../integrations/calendar/dateUtils";
import {
  cacheCalendarEvents,
  createCalendarSource,
  deleteCalendarSource,
  getCachedCalendarEvents,
  listCalendarSources,
} from "../../../storage/calendar";
import { getSetting, setSetting } from "../../../storage/settings";
import { DayView, MonthView, WeekView } from "./CalendarViews";
import "./Calendar.css";

type ViewKind = "month" | "week" | "day";

const SOURCE_COLORS = ["#7c9cff", "#ff8a8a", "#8affc1", "#ffd479", "#c792ff"];
const WINDOW_PAST_DAYS = 35;
const WINDOW_FUTURE_DAYS = 120;

export function Calendar() {
  const [sources, setSources] = useState<CalendarSource[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [view, setView] = useState<ViewKind>("month");
  const [anchorDate, setAnchorDate] = useState(() => startOfDay(new Date()));
  const [degraded, setDegraded] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [showGoogleForm, setShowGoogleForm] = useState(false);
  const [clientIdInput, setClientIdInput] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rangeStart = useMemo(() => addDays(startOfDay(new Date()), -WINDOW_PAST_DAYS), []);
  const rangeEnd = useMemo(() => addDays(startOfDay(new Date()), WINDOW_FUTURE_DAYS), []);

  async function refresh() {
    const srcs = await listCalendarSources();
    setSources(srcs);
    setGoogleConnected(await isGoogleCalendarConnected());

    let anyDegraded = false;
    let newestSync: string | null = null;
    const all: CalendarEvent[] = [];

    for (const source of srcs) {
      try {
        let fresh: CalendarEvent[];
        if (source.kind === "ics") {
          if (!source.file_path) throw new Error("missing file path");
          const text = await invoke<string>("read_text_file", { path: source.file_path });
          fresh = parseIcs(text, source.id, rangeStart, rangeEnd);
        } else {
          fresh = await fetchGoogleEvents(source.id, rangeStart, rangeEnd);
        }
        await cacheCalendarEvents(source.id, fresh);
        all.push(...fresh);
        newestSync = new Date().toISOString();
      } catch (err) {
        console.error(`calendar source ${source.id} failed, falling back to cache`, err);
        anyDegraded = true;
        const cached = await getCachedCalendarEvents(source.id);
        if (cached) {
          all.push(...cached.events);
          if (!newestSync || cached.cachedAt > newestSync) newestSync = cached.cachedAt;
        }
      }
    }

    setEvents(all);
    setDegraded(anyDegraded);
    setLastSynced(newestSync);
  }

  useEffect(() => {
    refresh().catch((err) => console.error("failed to load calendar", err));
    getSetting("google.clientId").then((v) => v && setClientIdInput(v));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = setInterval(() => refresh().catch((err) => console.error("calendar refresh failed", err)), 5 * 60_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sources.length]);

  async function addIcsSource() {
    const selected = await openDialog({ multiple: false, filters: [{ name: "iCalendar", extensions: ["ics"] }] });
    if (!selected || Array.isArray(selected)) return;
    const name = selected.split(/[\\/]/).pop() ?? "Calendar";
    const color = SOURCE_COLORS[sources.length % SOURCE_COLORS.length];
    await createCalendarSource({ kind: "ics", name, file_path: selected, color });
    setShowAddMenu(false);
    await refresh();
  }

  async function connectGoogle() {
    if (!clientIdInput.trim()) return;
    setConnecting(true);
    setError(null);
    try {
      await setSetting("google.clientId", clientIdInput.trim());
      await connectGoogleCalendar(clientIdInput.trim());
      const color = SOURCE_COLORS[sources.length % SOURCE_COLORS.length];
      await createCalendarSource({ kind: "google", name: "Google Calendar", color });
      setShowGoogleForm(false);
      setShowAddMenu(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to connect Google Calendar");
    } finally {
      setConnecting(false);
    }
  }

  async function removeSource(source: CalendarSource) {
    if (source.kind === "google") await disconnectGoogleCalendar();
    await deleteCalendarSource(source.id);
    await refresh();
  }

  function step(dir: 1 | -1) {
    if (view === "month") setAnchorDate((d) => addMonths(d, dir));
    else if (view === "week") setAnchorDate((d) => addDays(d, dir * 7));
    else setAnchorDate((d) => addDays(d, dir));
  }

  function selectDay(d: Date) {
    setAnchorDate(d);
    setView("day");
  }

  const heading =
    view === "month"
      ? anchorDate.toLocaleDateString(undefined, { month: "long", year: "numeric" })
      : anchorDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

  return (
    <WidgetFrame title="Calendar">
      <div className="calendar-widget">
        <div className="calendar-widget__toolbar">
          <div className="calendar-widget__nav">
            <button onClick={() => step(-1)} aria-label="Previous">
              ‹
            </button>
            <button onClick={() => setAnchorDate(startOfDay(new Date()))}>Today</button>
            <button onClick={() => step(1)} aria-label="Next">
              ›
            </button>
          </div>
          <span className="calendar-widget__heading">{heading}</span>
          <div className="calendar-widget__view-switch">
            {(["month", "week", "day"] as const).map((v) => (
              <button key={v} className={view === v ? "is-active" : ""} onClick={() => setView(v)}>
                {v[0].toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {degraded && (
          <p className="calendar-widget__status">
            ⚠ Showing last synced data{lastSynced ? ` from ${new Date(lastSynced).toLocaleString()}` : ""} — a source is
            unreachable.
          </p>
        )}

        {view === "month" && <MonthView anchorDate={anchorDate} events={events} sources={sources} onSelectDay={selectDay} />}
        {view === "week" && <WeekView anchorDate={anchorDate} events={events} sources={sources} onSelectDay={selectDay} />}
        {view === "day" && <DayView anchorDate={anchorDate} events={events} sources={sources} onSelectDay={selectDay} />}

        <div className="calendar-widget__sources">
          {sources.map((s) => (
            <span key={s.id} className="calendar-widget__source-chip" style={{ borderColor: s.color }}>
              {s.name}
              <button onClick={() => removeSource(s)} aria-label={`Remove ${s.name}`}>
                ×
              </button>
            </span>
          ))}
          <button className="calendar-widget__add-source" onClick={() => setShowAddMenu((v) => !v)}>
            + Source
          </button>
        </div>

        {showAddMenu && (
          <div className="calendar-widget__add-menu">
            <button onClick={addIcsSource}>Import .ics file</button>
            {googleConnected ? (
              <span className="calendar-widget__hint">Google Calendar already connected.</span>
            ) : showGoogleForm ? (
              <div className="calendar-widget__google-form">
                <input
                  placeholder="Google OAuth Client ID"
                  value={clientIdInput}
                  onChange={(e) => setClientIdInput(e.target.value)}
                />
                <p className="calendar-widget__hint">
                  In Google Cloud Console, create an OAuth client (type "Web application") with redirect URI{" "}
                  <code>{GOOGLE_REDIRECT_URI}</code>, then paste its Client ID here. Read-only access, nothing is ever written
                  back to your calendar.
                </p>
                <button disabled={connecting} onClick={connectGoogle}>
                  {connecting ? "Connecting…" : "Connect"}
                </button>
              </div>
            ) : (
              <button onClick={() => setShowGoogleForm(true)}>Connect Google Calendar</button>
            )}
            {error && <p className="calendar-widget__error">{error}</p>}
          </div>
        )}
      </div>
    </WidgetFrame>
  );
}
