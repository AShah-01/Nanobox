import { useEffect, useState } from "react";
import { WidgetFrame } from "../../../components/WidgetFrame";
import { Countdown as CountdownRecord, createCountdown, deleteCountdown, listCountdowns } from "../../../storage/countdowns";
import "./Countdown.css";

function timeRemaining(targetIso: string, now: Date) {
  const diffMs = new Date(targetIso).getTime() - now.getTime();
  const past = diffMs < 0;
  const abs = Math.abs(diffMs);
  const days = Math.floor(abs / 86_400_000);
  const hours = Math.floor((abs % 86_400_000) / 3_600_000);
  const minutes = Math.floor((abs % 3_600_000) / 60_000);
  return { past, days, hours, minutes };
}

export function Countdown() {
  const [countdowns, setCountdowns] = useState<CountdownRecord[]>([]);
  const [now, setNow] = useState(() => new Date());
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState("");
  const [date, setDate] = useState("");

  async function refresh() {
    setCountdowns(await listCountdowns());
  }

  useEffect(() => {
    refresh().catch((err) => console.error("failed to load countdowns", err));
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  async function add() {
    if (!label.trim() || !date) return;
    await createCountdown({ label: label.trim(), target_date: new Date(date).toISOString() });
    setLabel("");
    setDate("");
    setShowForm(false);
    await refresh();
  }

  return (
    <WidgetFrame title="Countdown">
      <div className="countdown-widget">
        <ul className="countdown-widget__list">
          {countdowns.map((c) => {
            const r = timeRemaining(c.target_date, now);
            return (
              <li key={c.id} className="countdown-widget__item">
                <div className="countdown-widget__info">
                  <span className="countdown-widget__label">{c.label}</span>
                  <span className="countdown-widget__value">
                    {r.past ? "was " : ""}
                    {r.days}d {r.hours}h {r.minutes}m {r.past ? "ago" : ""}
                  </span>
                </div>
                <button className="countdown-widget__delete" onClick={() => deleteCountdown(c.id).then(refresh)} aria-label="Delete">
                  ×
                </button>
              </li>
            );
          })}
          {countdowns.length === 0 && <li className="countdown-widget__empty">No countdowns yet.</li>}
        </ul>

        {showForm ? (
          <div className="countdown-widget__form">
            <input
              className="countdown-widget__input"
              placeholder="Label (e.g. Finals)"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
            <input
              className="countdown-widget__input"
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <div className="countdown-widget__form-actions">
              <button onClick={() => setShowForm(false)}>Cancel</button>
              <button className="countdown-widget__btn--primary" onClick={add}>
                Add
              </button>
            </div>
          </div>
        ) : (
          <button className="countdown-widget__add" onClick={() => setShowForm(true)}>
            + New countdown
          </button>
        )}
      </div>
    </WidgetFrame>
  );
}
