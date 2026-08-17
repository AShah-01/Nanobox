import { useEffect, useRef, useState, CSSProperties } from "react";
import {
  createWidgetInstance,
  deleteWidgetInstance,
  listWidgetInstances,
  updateWidgetLayout,
  updateWidgetOpacity,
  updateWidgetStyle,
  WidgetInstance,
} from "../storage/widgetInstances";
import { isHidingOthers, subscribeFocusMode } from "../core/focusModeStore";
import { deriveShades } from "../core/colorShades";
import { BORDER_STYLE_LABELS, BORDER_STYLES, borderStyleCss, BorderStyleId } from "../core/widgetBorderStyles";
import { CustomWidget } from "./built-in";
import { WidgetChromeContext } from "./WidgetChromeContext";
import { DEFAULT_SIZE, WIDGET_LABELS, WIDGET_REGISTRY, WidgetId } from "./registry";
import "./WidgetGrid.css";

const GRID_SNAP = 8;
const MIN_SIZE = 160;
const snap = (n: number) => Math.round(n / GRID_SNAP) * GRID_SNAP;

interface WidgetStyleSettings {
  color?: string;
  borderStyle?: BorderStyleId;
}

function parseStyleSettings(raw: string | null): WidgetStyleSettings {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function cellStyle(instance: WidgetInstance): CSSProperties {
  const style: CSSProperties = {
    left: instance.x,
    top: instance.y,
    width: instance.w,
    height: instance.h,
    opacity: instance.opacity,
  };
  const { color, borderStyle } = parseStyleSettings(instance.style_settings);
  const shades = color ? deriveShades(color) : null;
  if (shades) {
    Object.assign(style, {
      "--nb-accent": shades.accent,
      "--nb-accent-text": shades.accentText,
      "--nb-surface-alt": shades.surfaceAlt,
    });
  }
  if (borderStyle) {
    const css = borderStyleCss(borderStyle, shades?.accent ?? "var(--nb-accent)");
    Object.assign(style, { "--nb-widget-border": css.border, "--nb-widget-shadow": css.boxShadow });
  }
  return style;
}

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

  function setStyle(instance: WidgetInstance, next: WidgetStyleSettings) {
    // Drop undefined-valued keys (e.g. a "reset to theme" click) before deciding
    // whether anything's actually set — Object.keys() counts them even though
    // JSON.stringify would silently omit them, which previously could persist
    // "{}" instead of clearing the column to NULL.
    const cleaned = Object.fromEntries(Object.entries(next).filter(([, v]) => v !== undefined)) as WidgetStyleSettings;
    const json = Object.keys(cleaned).length > 0 ? JSON.stringify(cleaned) : null;
    setInstances((prev) => prev.map((i) => (i.id === instance.id ? { ...i, style_settings: json } : i)));
    updateWidgetStyle(instance.id, json).catch((err) => console.error("failed to save widget style", err));
  }

  function onCustomWidgetSaved(id: number, settings: string) {
    setInstances((prev) => prev.map((i) => (i.id === id ? { ...i, settings } : i)));
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
        const isCustom = instance.widget_type === "custom";
        const Component = isCustom ? null : WIDGET_REGISTRY[instance.widget_type as Exclude<WidgetId, "custom">];
        const isFocusMode = instance.widget_type === "focus-mode";
        if (!isCustom && !Component) return null;
        const style = parseStyleSettings(instance.style_settings);

        return (
          <div
            key={instance.id}
            className={`widget-grid__cell ${hideOthers && !isFocusMode ? "is-dimmed" : ""}`}
            style={cellStyle(instance)}
          >
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

                <label>
                  Colour
                  <div className="widget-grid__color-row">
                    <input
                      type="color"
                      value={style.color ?? "#7c9cff"}
                      onChange={(e) => setStyle(instance, { ...style, color: e.target.value })}
                    />
                    {style.color && (
                      <button className="widget-grid__color-reset" onClick={() => setStyle(instance, { ...style, color: undefined })}>
                        Reset to theme
                      </button>
                    )}
                  </div>
                </label>

                <label>
                  Style
                  <select
                    value={style.borderStyle ?? ""}
                    onChange={(e) =>
                      setStyle(instance, {
                        ...style,
                        borderStyle: (e.target.value || undefined) as BorderStyleId | undefined,
                      })
                    }
                  >
                    <option value="">Theme default</option>
                    {BORDER_STYLES.map((id) => (
                      <option key={id} value={id}>
                        {BORDER_STYLE_LABELS[id]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}

            <WidgetChromeContext.Provider
              value={{
                onDragStart: (e) => startDrag(e, instance),
                onOpenSettings: () => setOpenPopoverId(openPopoverId === instance.id ? null : instance.id),
                onClose: () => removeWidget(instance.id),
              }}
            >
              <div className="widget-grid__content">
                {isCustom ? (
                  <CustomWidget instance={instance} onSaved={(settings) => onCustomWidgetSaved(instance.id, settings)} />
                ) : (
                  Component && <Component />
                )}
              </div>
            </WidgetChromeContext.Provider>

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
            {(Object.keys(WIDGET_LABELS) as WidgetId[]).map((id) => (
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
