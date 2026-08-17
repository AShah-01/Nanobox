import { useEffect, useMemo, useState } from "react";
import { WidgetFrame } from "../../../components/WidgetFrame";
import { listRecentMoodLogs, logMood, MoodLog } from "../../../storage/moodLogs";
import "./MoodCheckIn.css";

const MOODS = ["😣", "🙁", "😐", "🙂", "😄"];

function todayIso(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function MoodCheckIn() {
  const [logs, setLogs] = useState<MoodLog[]>([]);
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [pendingMood, setPendingMood] = useState<string | null>(null);

  async function refresh() {
    setLogs(await listRecentMoodLogs(7));
  }

  useEffect(() => {
    refresh().catch((err) => console.error("failed to load mood logs", err));
  }, []);

  const today = todayIso(new Date());
  const todaysLog = useMemo(() => logs.find((l) => l.log_date === today), [logs, today]);

  async function pick(mood: string) {
    setPendingMood(mood);
    setShowNote(true);
  }

  async function save() {
    if (!pendingMood) return;
    await logMood(today, pendingMood, note.trim());
    setShowNote(false);
    setNote("");
    setPendingMood(null);
    await refresh();
  }

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const iso = todayIso(d);
    return logs.find((l) => l.log_date === iso);
  });

  return (
    <WidgetFrame title="Mood Check-in">
      <div className="mood-widget">
        <div className="mood-widget__picker">
          {MOODS.map((m) => (
            <button
              key={m}
              className={`mood-widget__emoji ${todaysLog?.mood === m ? "is-selected" : ""}`}
              onClick={() => pick(m)}
              aria-label={m}
            >
              {m}
            </button>
          ))}
        </div>

        {showNote && (
          <div className="mood-widget__note">
            <input
              placeholder="Anything to add? (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && save()}
              autoFocus
            />
            <button className="mood-widget__save" onClick={save}>
              Log
            </button>
          </div>
        )}

        {todaysLog && !showNote && <p className="mood-widget__logged">Logged for today: {todaysLog.mood}</p>}

        <div className="mood-widget__history">
          {last7.map((log, i) => (
            <span key={i} className="mood-widget__history-dot" title={log?.mood ?? "no entry"}>
              {log?.mood ?? "·"}
            </span>
          ))}
        </div>
      </div>
    </WidgetFrame>
  );
}
