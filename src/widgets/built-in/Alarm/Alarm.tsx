import { useEffect, useRef, useState } from "react";
import { isPermissionGranted, requestPermission, sendNotification } from "@tauri-apps/plugin-notification";
import { WidgetFrame } from "../../../components/WidgetFrame";
import {
  Alarm as AlarmRecord,
  AlarmSound,
  createAlarm,
  deleteAlarm,
  listAlarms,
  markAlarmFired,
  setAlarmEnabled,
  snoozeAlarm,
} from "../../../storage/alarms";
import { playTone } from "./tones";
import "./Alarm.css";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SNOOZE_MINUTES = 5;

function todayIso(d: Date) {
  return d.toISOString().slice(0, 10);
}

function dayMatches(days: string, date: Date) {
  if (!days) return true; // empty = every day
  const today = DAY_LABELS[date.getDay()];
  return days.split(",").includes(today);
}

export function Alarm() {
  const [alarms, setAlarms] = useState<AlarmRecord[]>([]);
  const [ringing, setRinging] = useState<Set<number>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState("");
  const [time, setTime] = useState("07:00");
  const [days, setDays] = useState<Set<string>>(new Set());
  const [sound, setSound] = useState<AlarmSound>(
    (localStorage.getItem("settings:defaultSound") as AlarmSound) || "chime",
  );
  const ringingRef = useRef(ringing);
  ringingRef.current = ringing;

  async function refresh() {
    setAlarms(await listAlarms());
  }

  useEffect(() => {
    refresh().catch((err) => console.error("failed to load alarms", err));
    isPermissionGranted().then((granted) => {
      if (!granted) requestPermission().catch(() => {});
    });
  }, []);

  useEffect(() => {
    const id = setInterval(async () => {
      const now = new Date();
      const current = await listAlarms();
      for (const a of current) {
        if (!a.enabled || ringingRef.current.has(a.id)) continue;

        if (a.snoozed_until) {
          if (new Date(a.snoozed_until) <= now) fire(a);
          continue;
        }

        if (a.last_fired_on === todayIso(now)) continue;
        if (a.time === now.toTimeString().slice(0, 5) && dayMatches(a.days, now)) fire(a);
      }
    }, 20_000);
    return () => clearInterval(id);
  }, []);

  function fire(alarm: AlarmRecord) {
    setRinging((prev) => new Set(prev).add(alarm.id));
    playTone(alarm.sound);
    sendNotification({ title: alarm.label || "Nanobox alarm", body: alarm.time });
  }

  async function dismiss(id: number) {
    setRinging((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    await markAlarmFired(id, todayIso(new Date()));
    await refresh();
  }

  async function snooze(id: number) {
    setRinging((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    const until = new Date(Date.now() + SNOOZE_MINUTES * 60_000).toISOString();
    await snoozeAlarm(id, until);
    await refresh();
  }

  async function toggleDay(day: string) {
    const next = new Set(days);
    next.has(day) ? next.delete(day) : next.add(day);
    setDays(next);
  }

  async function addAlarm() {
    await createAlarm({ label: label.trim(), time, days: Array.from(days).join(","), sound });
    setLabel("");
    setDays(new Set());
    setShowForm(false);
    await refresh();
  }

  return (
    <WidgetFrame title="Alarms">
      <div className="alarm-widget">
        <ul className="alarm-widget__list">
          {alarms.map((a) => (
            <li key={a.id} className={`alarm-widget__item ${ringing.has(a.id) ? "is-ringing" : ""}`}>
              {ringing.has(a.id) ? (
                <div className="alarm-widget__ringing">
                  <span>
                    ⏰ {a.label || "Alarm"} — {a.time}
                  </span>
                  <div className="alarm-widget__ringing-actions">
                    <button onClick={() => snooze(a.id)}>Snooze {SNOOZE_MINUTES}m</button>
                    <button onClick={() => dismiss(a.id)}>Dismiss</button>
                  </div>
                </div>
              ) : (
                <>
                  <input
                    type="checkbox"
                    checked={a.enabled}
                    onChange={(e) => setAlarmEnabled(a.id, e.target.checked).then(refresh)}
                    aria-label="Enabled"
                  />
                  <div className="alarm-widget__info">
                    <span className="alarm-widget__time">{a.time}</span>
                    <span className="alarm-widget__meta">
                      {a.label || "Alarm"}
                      {a.days && ` · ${a.days}`}
                      {a.snoozed_until && ` · snoozed`}
                    </span>
                  </div>
                  <button className="alarm-widget__delete" onClick={() => deleteAlarm(a.id).then(refresh)} aria-label="Delete">
                    ×
                  </button>
                </>
              )}
            </li>
          ))}
          {alarms.length === 0 && <li className="alarm-widget__empty">No alarms set.</li>}
        </ul>

        {showForm ? (
          <div className="alarm-widget__form">
            <div className="alarm-widget__form-row">
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="alarm-widget__time-input" />
              <input
                placeholder="Label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="alarm-widget__label-input"
              />
            </div>
            <div className="alarm-widget__days">
              {DAY_LABELS.map((d) => (
                <button
                  key={d}
                  className={`alarm-widget__day ${days.has(d) ? "is-selected" : ""}`}
                  onClick={() => toggleDay(d)}
                >
                  {d[0]}
                </button>
              ))}
            </div>
            <div className="alarm-widget__form-row">
              <select value={sound} onChange={(e) => setSound(e.target.value as AlarmSound)} className="alarm-widget__sound">
                <option value="chime">Chime</option>
                <option value="beep">Beep</option>
                <option value="digital">Digital</option>
              </select>
              <button className="alarm-widget__preview" onClick={() => playTone(sound)}>
                ▶
              </button>
            </div>
            <div className="alarm-widget__form-actions">
              <button onClick={() => setShowForm(false)}>Cancel</button>
              <button className="alarm-widget__btn--primary" onClick={addAlarm}>
                Save
              </button>
            </div>
          </div>
        ) : (
          <button className="alarm-widget__add" onClick={() => setShowForm(true)}>
            + New alarm
          </button>
        )}
      </div>
    </WidgetFrame>
  );
}
