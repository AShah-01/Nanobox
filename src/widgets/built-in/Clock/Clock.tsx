import { useEffect, useRef, useState } from "react";
import { WidgetFrame } from "../../../components/WidgetFrame";
import "./Clock.css";

type HourFormat = "12" | "24";

const DEFAULT_HOUR_FORMAT: HourFormat = "24";

export function Clock() {
  const [now, setNow] = useState(() => new Date());
  const [hourFormat, setHourFormat] = useState<HourFormat>(DEFAULT_HOUR_FORMAT);
  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("clock:hourFormat");
    if (saved === "12" || saved === "24") setHourFormat(saved);
  }, []);

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

  function chooseHourFormat(format: HourFormat) {
    setHourFormat(format);
  }

  function saveHourFormat() {
    localStorage.setItem("clock:hourFormat", hourFormat);
    setShowSettings(false);
  }

  const time = now.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: hourFormat === "12",
  });
  const date = now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  return (
    <WidgetFrame title="Clock">
      <div className="clock-widget">
        <div className="clock-widget__header">
          <button
            className="clock-widget__btn clock-widget__btn--settings"
            onClick={() => setShowSettings((s) => !s)}
            title="Clock settings"
          >
            ⚙️
          </button>
        </div>
        <span className="clock-widget__time">{time}</span>
        <span className="clock-widget__date">{date}</span>

        {showSettings && (
          <div className="clock-widget__settings" ref={settingsRef}>
            <h3 className="clock-widget__settings-title">Time Format</h3>
            <div className="clock-widget__settings-content">
              <button
                className={`clock-widget__format-btn${hourFormat === "12" ? " is-active" : ""}`}
                onClick={() => chooseHourFormat("12")}
              >
                12-hour
              </button>
              <button
                className={`clock-widget__format-btn${hourFormat === "24" ? " is-active" : ""}`}
                onClick={() => chooseHourFormat("24")}
              >
                24-hour
              </button>
            </div>
            <div className="clock-widget__settings-actions">
              <button className="clock-widget__settings-btn clock-widget__settings-btn--primary" onClick={saveHourFormat}>
                Save
              </button>
              <button className="clock-widget__settings-btn" onClick={() => setShowSettings(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </WidgetFrame>
  );
}
