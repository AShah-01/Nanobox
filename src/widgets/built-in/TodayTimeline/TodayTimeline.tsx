import { useEffect, useState } from "react";
import { WidgetFrame } from "../../../components/WidgetFrame";
import { createTimelineBlock, deleteTimelineBlock, listTimelineBlocks, TimelineBlock } from "../../../storage/timeline";
import "./TodayTimeline.css";

const COLORS = ["#7c9cff", "#ff8a8a", "#8affc1", "#ffd479", "#c792ff"];

function nowMinutes() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function TodayTimeline() {
  const [blocks, setBlocks] = useState<TimelineBlock[]>([]);
  const [now, setNow] = useState(nowMinutes());
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState("");
  const [icon, setIcon] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("10:00");

  async function refresh() {
    setBlocks(await listTimelineBlocks());
  }

  useEffect(() => {
    refresh().catch((err) => console.error("failed to load timeline", err));
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(nowMinutes()), 60_000);
    return () => clearInterval(id);
  }, []);

  async function add() {
    if (!label.trim()) return;
    await createTimelineBlock({ label: label.trim(), icon: icon.trim().slice(0, 2), color, start_time: start, end_time: end });
    setLabel("");
    setIcon("");
    setShowForm(false);
    await refresh();
  }

  return (
    <WidgetFrame title="Today">
      <div className="timeline-widget">
        <ul className="timeline-widget__list">
          {blocks.map((b) => {
            const active = now >= toMinutes(b.start_time) && now < toMinutes(b.end_time);
            return (
              <li key={b.id} className={`timeline-widget__item ${active ? "is-active" : ""}`} style={{ borderColor: b.color }}>
                <span className="timeline-widget__icon">{b.icon || "•"}</span>
                <div className="timeline-widget__info">
                  <span className="timeline-widget__label">{b.label}</span>
                  <span className="timeline-widget__time">
                    {b.start_time} – {b.end_time}
                  </span>
                </div>
                <button className="timeline-widget__delete" onClick={() => deleteTimelineBlock(b.id).then(refresh)} aria-label="Remove">
                  ×
                </button>
              </li>
            );
          })}
          {blocks.length === 0 && <li className="timeline-widget__empty">No blocks yet — add today's shape below.</li>}
        </ul>

        {showForm ? (
          <div className="timeline-widget__form">
            <div className="timeline-widget__form-row">
              <input className="timeline-widget__icon-input" placeholder="🎯" value={icon} onChange={(e) => setIcon(e.target.value)} />
              <input className="timeline-widget__label-input" placeholder="Label" value={label} onChange={(e) => setLabel(e.target.value)} />
            </div>
            <div className="timeline-widget__form-row">
              <input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
              <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
            <div className="timeline-widget__form-row">
              <div className="timeline-widget__swatches">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    className={`timeline-widget__swatch ${color === c ? "is-selected" : ""}`}
                    style={{ background: c }}
                    onClick={() => setColor(c)}
                    aria-label={c}
                  />
                ))}
              </div>
              <div className="timeline-widget__form-actions">
                <button onClick={() => setShowForm(false)}>Cancel</button>
                <button className="timeline-widget__btn--primary" onClick={add}>
                  Add
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button className="timeline-widget__add" onClick={() => setShowForm(true)}>
            + New block
          </button>
        )}
      </div>
    </WidgetFrame>
  );
}
