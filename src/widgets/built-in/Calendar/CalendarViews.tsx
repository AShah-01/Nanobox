import { CalendarEvent, CalendarSource } from "../../../integrations/calendar/types";
import { eventsOnDay, formatEventTime, monthGridDays, sameDay, weekDays } from "../../../integrations/calendar/dateUtils";

function colorFor(sources: CalendarSource[], sourceId: number): string {
  return sources.find((s) => s.id === sourceId)?.color ?? "#7c9cff";
}

interface ViewProps {
  anchorDate: Date;
  events: CalendarEvent[];
  sources: CalendarSource[];
  onSelectDay: (d: Date) => void;
}

export function MonthView({ anchorDate, events, sources, onSelectDay }: ViewProps) {
  const days = monthGridDays(anchorDate);
  const today = new Date();

  return (
    <div className="calendar-widget__month">
      <div className="calendar-widget__weekday-row">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="calendar-widget__month-grid">
        {days.map((day) => {
          const dayEvents = eventsOnDay(events, day);
          const inMonth = day.getMonth() === anchorDate.getMonth();
          return (
            <button
              key={day.toISOString()}
              className={[
                "calendar-widget__day-cell",
                inMonth ? "" : "is-outside-month",
                sameDay(day, today) ? "is-today" : "",
                sameDay(day, anchorDate) ? "is-selected" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => onSelectDay(day)}
            >
              <span className="calendar-widget__day-number">{day.getDate()}</span>
              <span className="calendar-widget__day-dots">
                {dayEvents.slice(0, 3).map((e) => (
                  <span key={e.id} className="calendar-widget__dot" style={{ background: colorFor(sources, e.sourceId) }} />
                ))}
                {dayEvents.length > 3 && <span className="calendar-widget__dot-overflow">+{dayEvents.length - 3}</span>}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function WeekView({ anchorDate, events, sources, onSelectDay }: ViewProps) {
  const days = weekDays(anchorDate);
  return (
    <div className="calendar-widget__week">
      {days.map((day) => {
        const dayEvents = eventsOnDay(events, day);
        return (
          <button
            key={day.toISOString()}
            className={`calendar-widget__week-day ${sameDay(day, anchorDate) ? "is-selected" : ""}`}
            onClick={() => onSelectDay(day)}
          >
            <span className="calendar-widget__week-day-label">
              {day.toLocaleDateString(undefined, { weekday: "short", day: "numeric" })}
            </span>
            <span className="calendar-widget__week-day-events">
              {dayEvents.length === 0 ? (
                <span className="calendar-widget__week-day-empty">—</span>
              ) : (
                dayEvents.slice(0, 4).map((e) => (
                  <span key={e.id} className="calendar-widget__week-chip" style={{ borderColor: colorFor(sources, e.sourceId) }}>
                    {e.title}
                  </span>
                ))
              )}
              {dayEvents.length > 4 && <span className="calendar-widget__week-day-empty">+{dayEvents.length - 4} more</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function DayView({ anchorDate, events, sources }: ViewProps) {
  const dayEvents = eventsOnDay(events, anchorDate);
  return (
    <ul className="calendar-widget__agenda">
      {dayEvents.length === 0 && <li className="calendar-widget__agenda-empty">Nothing on the calendar.</li>}
      {dayEvents.map((e) => (
        <li key={e.id} className="calendar-widget__agenda-item" style={{ borderColor: colorFor(sources, e.sourceId) }}>
          <span className="calendar-widget__agenda-time">{e.allDay ? "All day" : formatEventTime(e.start)}</span>
          <div className="calendar-widget__agenda-info">
            <span className="calendar-widget__agenda-title">{e.title}</span>
            {e.location && <span className="calendar-widget__agenda-location">{e.location}</span>}
          </div>
        </li>
      ))}
    </ul>
  );
}
