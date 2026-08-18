import { useEffect, useRef, useState } from "react";
import { sendNotification } from "@tauri-apps/plugin-notification";
import { WidgetFrame } from "../../../components/WidgetFrame";
import { TimePickerWheel } from "../../../components/TimePickerWheel";
import { setHideOthers } from "../../../core/focusModeStore";
import { playTone } from "../Alarm/tones";
import type { AlarmSound } from "../../../storage/alarms";
import "./FocusMode.css";

const DEFAULT_WORK_MINUTES = 25;
const DEFAULT_BREAK_MINUTES = 5;
const DEFAULT_SOUND: AlarmSound = "chime";
const SOUND_LABELS: Record<AlarmSound, string> = { chime: "Chime", beep: "Beep", digital: "Digital" };

type Phase = "work" | "break";

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function FocusMode() {
  const [workMinutes, setWorkMinutes] = useState(DEFAULT_WORK_MINUTES);
  const [breakMinutes, setBreakMinutes] = useState(DEFAULT_BREAK_MINUTES);
  const [notifySound, setNotifySound] = useState<AlarmSound>(
    (localStorage.getItem("settings:defaultSound") as AlarmSound) || DEFAULT_SOUND,
  );
  const [phase, setPhase] = useState<Phase>("work");
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_WORK_MINUTES * 60);
  const [running, setRunning] = useState(false);
  const [cycles, setCycles] = useState(0);
  const [hideOthersChecked, setHideOthersChecked] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("focusMode:times");
    if (saved) {
      try {
        const { work, break: brk, sound } = JSON.parse(saved);
        setWorkMinutes(work);
        setBreakMinutes(brk);
        setSecondsLeft(work * 60);
        if (sound === "chime" || sound === "beep" || sound === "digital") setNotifySound(sound);
      } catch (e) {
        console.error("Failed to load focus times", e);
      }
    }
  }, []);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s > 1) return s - 1;

        const nextPhase: Phase = phase === "work" ? "break" : "work";
        playTone(notifySound);
        sendNotification({
          title: "Nanobox Focus",
          body: nextPhase === "break" ? "Nice work — take a break." : "Break's over — back to it.",
        });
        if (phase === "work") setCycles((c) => c + 1);
        setPhase(nextPhase);
        return (nextPhase === "work" ? workMinutes : breakMinutes) * 60;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, phase, workMinutes, breakMinutes, notifySound]);

  useEffect(() => {
    setHideOthers(running && phase === "work" && hideOthersChecked);
    return () => setHideOthers(false);
  }, [running, phase, hideOthersChecked]);

  function reset() {
    setRunning(false);
    setPhase("work");
    setSecondsLeft(workMinutes * 60);
  }

  function saveTimes() {
    localStorage.setItem(
      "focusMode:times",
      JSON.stringify({ work: workMinutes, break: breakMinutes, sound: notifySound }),
    );
    setShowSettings(false);
  }

  useEffect(() => {
    if (!showSettings) return;
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSettings]);

  return (
    <WidgetFrame title="Focus Mode">
      <div className="focus-widget">
        <span className={`focus-widget__phase focus-widget__phase--${phase}`}>{phase === "work" ? "Focus" : "Break"}</span>
        <span className="focus-widget__time">{formatTime(secondsLeft)}</span>
        <div className="focus-widget__controls">
          <button className="focus-widget__btn focus-widget__btn--primary" onClick={() => setRunning((r) => !r)}>
            {running ? "Pause" : "Start"}
          </button>
          <button className="focus-widget__btn" onClick={reset}>
            Reset
          </button>
          <button
            className="focus-widget__btn focus-widget__btn--settings"
            onClick={() => setShowSettings((s) => !s)}
            title="Adjust focus and break times"
          >
            ⚙️
          </button>
        </div>
        <label className="focus-widget__toggle">
          <input type="checkbox" checked={hideOthersChecked} onChange={(e) => setHideOthersChecked(e.target.checked)} />
          Hide other widgets while focusing
        </label>
        <span className="focus-widget__cycles">{cycles} cycle{cycles === 1 ? "" : "s"} completed</span>

        {showSettings && (
          <div className="focus-widget__settings" ref={settingsRef}>
            <h3 className="focus-widget__settings-title">Adjust Times</h3>
            <div className="focus-widget__settings-content">
              <TimePickerWheel label="Work" value={workMinutes} onChange={setWorkMinutes} min={1} max={120} />
              <TimePickerWheel label="Break" value={breakMinutes} onChange={setBreakMinutes} min={1} max={60} />
            </div>
            <div className="focus-widget__settings-sound">
              <label htmlFor="focus-sound" className="focus-widget__settings-sound-label">
                Notification sound
              </label>
              <div className="focus-widget__settings-sound-row">
                <select
                  id="focus-sound"
                  value={notifySound}
                  onChange={(e) => setNotifySound(e.target.value as AlarmSound)}
                >
                  {(Object.keys(SOUND_LABELS) as AlarmSound[]).map((s) => (
                    <option key={s} value={s}>
                      {SOUND_LABELS[s]}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="focus-widget__settings-sound-preview"
                  onClick={() => playTone(notifySound)}
                  aria-label="Preview sound"
                  title="Preview sound"
                >
                  ▶
                </button>
              </div>
            </div>
            <div className="focus-widget__settings-actions">
              <button className="focus-widget__settings-btn focus-widget__settings-btn--primary" onClick={saveTimes}>
                Save
              </button>
              <button className="focus-widget__settings-btn" onClick={() => setShowSettings(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </WidgetFrame>
  );
}
