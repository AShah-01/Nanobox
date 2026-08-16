import { useEffect, useRef, useState } from "react";
import { sendNotification } from "@tauri-apps/plugin-notification";
import { WidgetFrame } from "../../../components/WidgetFrame";
import { setHideOthers } from "../../../core/focusModeStore";
import "./FocusMode.css";

const WORK_MINUTES = 25;
const BREAK_MINUTES = 5;

type Phase = "work" | "break";

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function FocusMode() {
  const [phase, setPhase] = useState<Phase>("work");
  const [secondsLeft, setSecondsLeft] = useState(WORK_MINUTES * 60);
  const [running, setRunning] = useState(false);
  const [cycles, setCycles] = useState(0);
  const [hideOthersChecked, setHideOthersChecked] = useState(true);
  const runningRef = useRef(running);
  runningRef.current = running;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s > 1) return s - 1;

        const nextPhase: Phase = phase === "work" ? "break" : "work";
        sendNotification({
          title: "Nanobox Focus",
          body: nextPhase === "break" ? "Nice work — take a break." : "Break's over — back to it.",
        });
        if (phase === "work") setCycles((c) => c + 1);
        setPhase(nextPhase);
        return (nextPhase === "work" ? WORK_MINUTES : BREAK_MINUTES) * 60;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, phase]);

  useEffect(() => {
    setHideOthers(running && phase === "work" && hideOthersChecked);
    return () => setHideOthers(false);
  }, [running, phase, hideOthersChecked]);

  function reset() {
    setRunning(false);
    setPhase("work");
    setSecondsLeft(WORK_MINUTES * 60);
  }

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
        </div>
        <label className="focus-widget__toggle">
          <input type="checkbox" checked={hideOthersChecked} onChange={(e) => setHideOthersChecked(e.target.checked)} />
          Hide other widgets while focusing
        </label>
        <span className="focus-widget__cycles">{cycles} cycle{cycles === 1 ? "" : "s"} completed</span>
      </div>
    </WidgetFrame>
  );
}
