import { useEffect, useRef, useState } from "react";
import {
  createWidgetInstance,
  deleteWidgetInstance,
  listWidgetInstances,
  updateWidgetLayout,
  updateWidgetOpacity,
  WidgetInstance,
} from "../storage/widgetInstances";
import { isHidingOthers, subscribeFocusMode } from "../core/focusModeStore";
import { DEFAULT_SIZE, WIDGET_LABELS, WIDGET_REGISTRY, WidgetId } from "./registry";
import "./WidgetGrid.css";

const GRID_SNAP = 8;
const MIN_SIZE = 160;
const snap = (n: number) => Math.round(n / GRID_SNAP) * GRID_SNAP;

export function WidgetGrid() {
  const [instances, setInstances] = useState<WidgetInstance[]>([]);
  const [openPopoverId, setOpenPopoverId] = useState<number | null>(null);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [hideOthers, setHideOthersState] = useState(isHidingOthers());
  const containerRef = useRef<HTMLDivElement>(null);

  async function refresh() {
    const list = await listWidgetInstances();
    if (list.length === 0) {
      await createWidgetInstance({ widget_type: "clock", x: 24, y: 24, ...DEFAULT_SIZE.clock });
      setInstances(await listWidgetInstances());
    } else {
      setInstances(list);
    }
  }

  useEffect(() => {
    refresh().catch((err) => console.error("failed to load widget layout", err));
  }, []);

  useEffect(() => subscribeFocusMode(() => setHideOthersState(isHidingOthers())), []);

  function addWidget(type: WidgetId) {
    const size = DEFAULT_SIZE[type];
    const offset = instances.length * 16;
    createWidgetInstance({ widget_type: type, x: snap(24 + offset), y: snap(24 + offset), ...size })
      .then(refresh)
      .catch((err) => console.error("failed to add widget", err));
    setAddMenuOpen(false);
  }

  function removeWidget(id: number) {
    deleteWidgetInstance(id)
      .then(refresh)
      .catch((err) => console.error("failed to remove widget", err));
    setOpenPopoverId(null);
  }

  function setOpacity(id: number, opacity: number) {
    setInstances((prev) => prev.map((i) => (i.id === id ? { ...i, opacity } : i)));
    updateWidgetOpacity(id, opacity).catch((err) => console.error("failed to save opacity", err));
  }

  function startDrag(e: React.PointerEvent, instance: WidgetInstance) {
    if ((e.target as HTMLElement).closest("[data-no-drag]")) return;
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    const startX = e.clientX;
    const startY = e.clientY;
    const originX = instance.x;
    const originY = instance.y;
    const bounds = containerRef.current?.getBoundingClientRect();

    function onMove(ev: PointerEvent) {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      let nextX = originX + dx;
      let nextY = originY + dy;
      if (bounds) {
        nextX = Math.max(0, Math.min(nextX, bounds.width - instance.w));
        nextY = Math.max(0, Math.min(nextY, bounds.height - instance.h));
      }
      setInstances((prev) => prev.map((i) => (i.id === instance.id ? { ...i, x: nextX, y: nextY } : i)));
    }

    function onUp() {
      target.removeEventListener("pointermove", onMove);
      target.removeEventListener("pointerup", onUp);
      setInstances((prev) => {
        const current = prev.find((i) => i.id === instance.id);
        if (current) {
          const snapped = { x: snap(current.x), y: snap(current.y), w: current.w, h: current.h };
          updateWidgetLayout(instance.id, snapped).catch((err) => console.error("failed to save position", err));
          return prev.map((i) => (i.id === instance.id ? { ...i, ...snapped } : i));
        }
        return prev;
      });
    }

    target.addEventListener("pointermove", onMove);
    target.addEventListener("pointerup", onUp);
  }

  function startResize(e: React.PointerEvent, instance: WidgetInstance) {
    e.preventDefault();
    e.stopPropagation();
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    const startX = e.clientX;
    const startY = e.clientY;
    const originW = instance.w;
    const originH = instance.h;

    function onMove(ev: PointerEvent) {
      const nextW = Math.max(MIN_SIZE, originW + (ev.clientX - startX));
      const nextH = Math.max(MIN_SIZE, originH + (ev.clientY - startY));
      setInstances((prev) => prev.map((i) => (i.id === instance.id ? { ...i, w: nextW, h: nextH } : i)));
    }

    function onUp() {
      target.removeEventListener("pointermove", onMove);
      target.removeEventListener("pointerup", onUp);
      setInstances((prev) => {
        const current = prev.find((i) => i.id === instance.id);
        if (current) {
          const snapped = { x: current.x, y: current.y, w: snap(current.w), h: snap(current.h) };
          updateWidgetLayout(instance.id, snapped).catch((err) => console.error("failed to save size", err));
          return prev.map((i) => (i.id === instance.id ? { ...i, ...snapped } : i));
        }
        return prev;
      });
    }

    target.addEventListener("pointermove", onMove);
    target.addEventListener("pointerup", onUp);
  }

  return (
    <div className="widget-grid" ref={containerRef}>
      {instances.map((instance) => {
        const Component = WIDGET_REGISTRY[instance.widget_type];
        const isFocusMode = instance.widget_type === "focus-mode";
        if (!Component) return null;
        return (
          <div
            key={instance.id}
            className={`widget-grid__cell ${hideOthers && !isFocusMode ? "is-dimmed" : ""}`}
            style={{ left: instance.x, top: instance.y, width: instance.w, height: instance.h, opacity: instance.opacity }}
          >
            <div className="widget-grid__chrome" onPointerDown={(e) => startDrag(e, instance)}>
              <span className="widget-grid__grip">⠿</span>
              <button
                className="widget-grid__gear"
                data-no-drag
                onClick={() => setOpenPopoverId(openPopoverId === instance.id ? null : instance.id)}
                aria-label="Widget settings"
              >
                ⚙
              </button>
            </div>

            {openPopoverId === instance.id && (
              <div className="widget-grid__popover" data-no-drag>
                <label>
                  Opacity
                  <input
                    type="range"
                    min={0.2}
                    max={1}
                    step={0.05}
                    value={instance.opacity}
                    onChange={(e) => setOpacity(instance.id, Number(e.target.value))}
                  />
                </label>
                <button className="widget-grid__remove" onClick={() => removeWidget(instance.id)}>
                  Remove widget
                </button>
              </div>
            )}

            <div className="widget-grid__content">
              <Component />
            </div>

            <div className="widget-grid__resize" onPointerDown={(e) => startResize(e, instance)} />
          </div>
        );
      })}

      <div className="widget-grid__add">
        <button className="widget-grid__add-btn" onClick={() => setAddMenuOpen((v) => !v)}>
          + Add widget
        </button>
        {addMenuOpen && (
          <div className="widget-grid__add-menu">
            {(Object.keys(WIDGET_REGISTRY) as WidgetId[]).map((id) => (
              <button key={id} onClick={() => addWidget(id)}>
                {WIDGET_LABELS[id]}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
