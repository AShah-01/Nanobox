import { useEffect, useState } from "react";
import { sendNotification } from "@tauri-apps/plugin-notification";
import { WidgetFrame } from "../../../components/WidgetFrame";
import { playTone } from "../Alarm/tones";
import "./VisualTimer.css";

const PRESETS = [5, 10, 15, 25, 45];

/** Time Timer-style: a shrinking colour disk, readable at a glance without reading digits. */
export function VisualTimer() {
  const [totalSeconds, setTotalSeconds] = useState(15 * 60);
  const [secondsLeft, setSecondsLeft] = useState(15 * 60);
  const [running, setRunning] = useState(false);
  const [customMinutes, setCustomMinutes] = useState("");

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          setRunning(false);
          playTone("chime");
          sendNotification({ title: "Nanobox Timer", body: "Time's up." });
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  function setDuration(minutes: number) {
    setRunning(false);
    setTotalSeconds(minutes * 60);
    setSecondsLeft(minutes * 60);
  }

  function applyCustom() {
    const minutes = Number(customMinutes);
    if (minutes > 0) setDuration(minutes);
    setCustomMinutes("");
  }

  const pct = totalSeconds > 0 ? secondsLeft / totalSeconds : 0;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <WidgetFrame title="Visual Timer">
      <div className="visual-timer">
        <div
          className="visual-timer__disk"
          style={{ ["--pct" as string]: pct }}
          role="img"
          aria-label={`${minutes} minutes ${seconds} seconds remaining`}
        >
          <span className="visual-timer__readout">
            {minutes}:{seconds.toString().padStart(2, "0")}
          </span>
        </div>

        <div className="visual-timer__presets">
          {PRESETS.map((m) => (
            <button key={m} className={totalSeconds === m * 60 ? "is-active" : ""} onClick={() => setDuration(m)}>
              {m}m
            </button>
          ))}
        </div>

        <div className="visual-timer__custom">
          <input
            type="number"
            min={1}
            placeholder="Custom min"
            value={customMinutes}
            onChange={(e) => setCustomMinutes(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyCustom()}
          />
          <button onClick={applyCustom}>Set</button>
        </div>

        <div className="visual-timer__controls">
          <button
            className="visual-timer__btn--primary"
            onClick={() => setRunning((r) => !r)}
            disabled={secondsLeft === 0}
          >
            {running ? "Pause" : "Start"}
          </button>
          <button onClick={() => setDuration(totalSeconds / 60)}>Reset</button>
        </div>
      </div>
    </WidgetFrame>
  );
}
