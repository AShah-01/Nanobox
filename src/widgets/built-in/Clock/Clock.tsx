import { useEffect, useState } from "react";
import { WidgetFrame } from "../../../components/WidgetFrame";
import "./Clock.css";

/** Milestone 1: hardcoded digital clock, local timezone, 24hr. */
export function Clock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const time = now.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const date = now.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <WidgetFrame>
      <div className="clock-widget">
        <span className="clock-widget__time">{time}</span>
        <span className="clock-widget__date">{date}</span>
      </div>
    </WidgetFrame>
  );
}
