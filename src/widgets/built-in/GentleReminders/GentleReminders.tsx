import { useEffect, useState } from "react";
import { sendNotification } from "@tauri-apps/plugin-notification";
import { WidgetFrame } from "../../../components/WidgetFrame";
import {
  createReminder,
  deleteReminder,
  listReminders,
  markReminderFired,
  Reminder,
  setReminderEnabled,
} from "../../../storage/reminders";
import { playTone } from "../Alarm/tones";
import "./GentleReminders.css";

const INTERVAL_PRESETS = [15, 30, 45, 60, 90];

/** Sprout/Finch-style interval nudges — repeats every N minutes, not tied to a clock time (that's the Alarm widget). */
export function GentleReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState("");
  const [interval, setIntervalMinutes] = useState(45);

  async function refresh() {
    setReminders(await listReminders());
  }

  useEffect(() => {
    refresh().catch((err) => console.error("failed to load reminders", err));
  }, []);

  useEffect(() => {
    const id = setInterval(async () => {
      const now = Date.now();
      const current = await listReminders();
      for (const r of current) {
        if (!r.enabled || !r.last_fired_at) continue;
        const elapsedMs = now - new Date(r.last_fired_at).getTime();
        if (elapsedMs >= r.interval_minutes * 60_000) {
          sendNotification({ title: "Nanobox", body: r.label });
          playTone("beep");
          await markReminderFired(r.id, new Date().toISOString());
        }
      }
      refresh();
    }, 30_000);
    return () => clearInterval(id);
  }, []);

  async function add() {
    if (!label.trim()) return;
    await createReminder(label.trim(), interval);
    const created = await listReminders();
    const newest = created[created.length - 1];
    if (newest) await markReminderFired(newest.id, new Date().toISOString());
    setLabel("");
    setShowForm(false);
    await refresh();
  }

  return (
    <WidgetFrame title="Gentle Reminders">
      <div className="reminders-widget">
        <ul className="reminders-widget__list">
          {reminders.map((r) => (
            <li key={r.id} className="reminders-widget__item">
              <input
                type="checkbox"
                checked={r.enabled}
                onChange={(e) => setReminderEnabled(r.id, e.target.checked).then(refresh)}
                aria-label="Enabled"
              />
              <div className="reminders-widget__info">
                <span className="reminders-widget__label">{r.label}</span>
                <span className="reminders-widget__meta">every {r.interval_minutes}m</span>
              </div>
              <button className="reminders-widget__delete" onClick={() => deleteReminder(r.id).then(refresh)} aria-label="Delete">
                ×
              </button>
            </li>
          ))}
          {reminders.length === 0 && <li className="reminders-widget__empty">No gentle nudges set.</li>}
        </ul>

        {showForm ? (
          <div className="reminders-widget__form">
            <input
              placeholder="e.g. Drink water"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              autoFocus
            />
            <div className="reminders-widget__presets">
              {INTERVAL_PRESETS.map((m) => (
                <button
                  key={m}
                  className={interval === m ? "is-active" : ""}
                  onClick={() => setIntervalMinutes(m)}
                >
                  {m}m
                </button>
              ))}
            </div>
            <div className="reminders-widget__form-actions">
              <button onClick={() => setShowForm(false)}>Cancel</button>
              <button className="reminders-widget__btn--primary" onClick={add}>
                Add
              </button>
            </div>
          </div>
        ) : (
          <button className="reminders-widget__add" onClick={() => setShowForm(true)}>
            + New reminder
          </button>
        )}
      </div>
    </WidgetFrame>
  );
}
