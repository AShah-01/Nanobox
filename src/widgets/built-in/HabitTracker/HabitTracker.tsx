import { useEffect, useState } from "react";
import { WidgetFrame } from "../../../components/WidgetFrame";
import {
  computeStreak,
  createHabit,
  deleteHabit,
  Habit,
  HabitLog,
  listHabits,
  listRecentLogs,
  toggleHabitToday,
} from "../../../storage/habits";
import "./HabitTracker.css";

const COLORS = ["#7c9cff", "#ff8a8a", "#8affc1", "#ffd479", "#c792ff"];

function todayIso(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function HabitTracker() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);

  async function refresh() {
    const [h, l] = await Promise.all([listHabits(), listRecentLogs(90)]);
    setHabits(h);
    setLogs(l);
  }

  useEffect(() => {
    refresh().catch((err) => console.error("failed to load habits", err));
  }, []);

  const today = todayIso(new Date());
  const isDoneToday = (habitId: number) => logs.some((l) => l.habit_id === habitId && l.log_date === today);

  async function toggle(habit: Habit) {
    await toggleHabitToday(habit.id, today, !isDoneToday(habit.id));
    await refresh();
  }

  async function add() {
    if (!name.trim()) return;
    await createHabit({ name: name.trim(), color });
    setName("");
    setShowForm(false);
    await refresh();
  }

  return (
    <WidgetFrame title="Habits">
      <div className="habit-widget">
        <ul className="habit-widget__list">
          {habits.map((h) => {
            const done = isDoneToday(h.id);
            const streak = computeStreak(h.id, logs, new Date());
            return (
              <li key={h.id} className="habit-widget__item">
                <button
                  className={`habit-widget__check ${done ? "is-done" : ""}`}
                  style={{ borderColor: h.color, background: done ? h.color : "transparent" }}
                  onClick={() => toggle(h)}
                  aria-label={done ? "Mark not done" : "Mark done"}
                >
                  {done && "✓"}
                </button>
                <span className="habit-widget__name">{h.name}</span>
                <span className="habit-widget__streak">{streak > 0 ? `🔥 ${streak}` : ""}</span>
                <button className="habit-widget__delete" onClick={() => deleteHabit(h.id).then(refresh)} aria-label="Remove">
                  ×
                </button>
              </li>
            );
          })}
          {habits.length === 0 && <p className="habit-widget__empty">No habits yet.</p>}
        </ul>

        {showForm ? (
          <div className="habit-widget__form">
            <input
              className="habit-widget__input"
              placeholder="Habit name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
            <div className="habit-widget__swatches">
              {COLORS.map((c) => (
                <button
                  key={c}
                  className={`habit-widget__swatch ${color === c ? "is-selected" : ""}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                  aria-label={c}
                />
              ))}
            </div>
            <div className="habit-widget__form-actions">
              <button onClick={() => setShowForm(false)}>Cancel</button>
              <button className="habit-widget__btn--primary" onClick={add}>
                Add
              </button>
            </div>
          </div>
        ) : (
          <button className="habit-widget__add" onClick={() => setShowForm(true)}>
            + New habit
          </button>
        )}
      </div>
    </WidgetFrame>
  );
}
