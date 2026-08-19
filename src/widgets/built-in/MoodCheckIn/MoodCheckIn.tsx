import { useEffect, useMemo, useState } from "react";
import { WidgetFrame } from "../../../components/WidgetFrame";
import { listRecentMoodLogs, logMood, MoodLog } from "../../../storage/moodLogs";
import "./MoodCheckIn.css";

const MOODS = ["😣", "🙁", "😐", "🙂", "😄"];

function todayIso(d: Date) {
  return d.toISOString().slice(0, 10);
}

// Mirrors listRecentMoodLogs(7): the window runs from 6 days ago through today
// (7 entries inclusive), so a date is still editable while today - date <= 6.
function isWithinEditableWindow(dateIso: string, todayIsoStr: string) {
  const daysAgo = Math.round((Date.parse(todayIsoStr) - Date.parse(dateIso)) / 86_400_000);
  return daysAgo >= 0 && daysAgo <= 6;
}

export function MoodCheckIn() {
  const [logs, setLogs] = useState<MoodLog[]>([]);
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [pendingMood, setPendingMood] = useState<string | null>(null);

  const today = todayIso(new Date());
  const [targetDate, setTargetDate] = useState(today);

  async function refresh() {
    setLogs(await listRecentMoodLogs(7));
  }

  useEffect(() => {
    refresh().catch((err) => console.error("failed to load mood logs", err));
  }, []);

  const targetLog = useMemo(() => logs.find((l) => l.log_date === targetDate), [logs, targetDate]);

  function selectDate(iso: string) {
    if (!isWithinEditableWindow(iso, today)) return;
    setTargetDate(iso);
    setShowNote(false);
    setPendingMood(null);
  }

  async function pick(mood: string) {
    if (!isWithinEditableWindow(targetDate, today)) return;
    setPendingMood(mood);
    setShowNote(true);
  }

  async function save() {
    if (!pendingMood || !isWithinEditableWindow(targetDate, today)) {
      setShowNote(false);
      setPendingMood(null);
      return;
    }
    await logMood(targetDate, pendingMood, note.trim());
    setShowNote(false);
    setNote("");
    setPendingMood(null);
    setTargetDate(today);
    await refresh();
  }

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const iso = todayIso(d);
    return { iso, log: logs.find((l) => l.log_date === iso) };
  });

  return (
    <WidgetFrame title="Mood Check-in">
      <div className="mood-widget">
        {targetDate !== today && (
          <p className="mood-widget__editing">
            Backfilling {targetDate}
            <button className="mood-widget__editing-cancel" onClick={() => selectDate(today)}>
              back to today
            </button>
          </p>
        )}

        <div className="mood-widget__picker">
          {MOODS.map((m) => (
            <button
              key={m}
              className={`mood-widget__emoji ${targetLog?.mood === m ? "is-selected" : ""}`}
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

        {targetLog && !showNote && (
          <p className="mood-widget__logged">
            Logged for {targetDate === today ? "today" : targetDate}: {targetLog.mood}
          </p>
        )}

        <div className="mood-widget__history">
          {last7.map(({ iso, log }) => {
            const editable = isWithinEditableWindow(iso, today);
            const classNames = [
              "mood-widget__history-dot",
              iso === today && "is-today",
              iso === targetDate && "is-target",
              editable && !log && "is-missing",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <button
                key={iso}
                type="button"
                className={classNames}
                title={log ? `${iso}: ${log.mood}` : editable ? `${iso}: click to log` : iso}
                onClick={editable ? () => selectDate(iso) : undefined}
                disabled={!editable}
              >
                {log?.mood ?? "·"}
              </button>
            );
          })}
        </div>
      </div>
    </WidgetFrame>
  );
}
