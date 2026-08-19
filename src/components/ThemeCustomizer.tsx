import { useEffect, useRef, useState } from "react";
import { ThemeId, ThemeMeta } from "../themes/themes";
import { getThemeCustomization, setThemeCustomization } from "../core/themeStore";
import { exportTheme, importTheme } from "../core/themeExport";
import { BORDER_STYLES, BORDER_STYLE_LABELS, BorderStyleId } from "../core/widgetBorderStyles";
import "./ThemeCustomizer.css";

interface ThemeCustomizerProps {
  theme: ThemeMeta;
  onClose: () => void;
  /** Called after a successful import, since it may target a different theme than the one this popover opened for. */
  onImported: (id: ThemeId) => void;
}

const DEFAULT_TINT = "#888888";

export function ThemeCustomizer({ theme, onClose, onImported }: ThemeCustomizerProps) {
  const initial = getThemeCustomization(theme.id);
  const [tint, setTint] = useState(initial.tint ?? "");
  const [fontScale, setFontScale] = useState(initial.fontScale ?? 1);
  const [radius, setRadius] = useState(initial.radius ?? 14);
  const [borderStyle, setBorderStyle] = useState<BorderStyleId | "">(initial.borderStyle ?? "");
  const [importError, setImportError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  function apply(overrides: Partial<{ tint: string; fontScale: number; radius: number; borderStyle: BorderStyleId | "" }> = {}) {
    const next = { tint, fontScale, radius, borderStyle, ...overrides };
    setThemeCustomization(theme.id, {
      tint: next.tint || undefined,
      fontScale: next.fontScale !== 1 ? next.fontScale : undefined,
      radius: next.radius !== 14 ? next.radius : undefined,
      borderStyle: next.borderStyle || undefined,
    });
  }

  function handleReset() {
    setTint("");
    setFontScale(1);
    setRadius(14);
    setBorderStyle("");
    setThemeCustomization(theme.id, { tint: undefined, fontScale: undefined, radius: undefined, borderStyle: undefined });
  }

  async function handleExport() {
    apply(); // make sure what gets exported matches what's currently shown
    try {
      await exportTheme(theme.id);
    } catch (err) {
      console.error("theme export failed", err);
    }
  }

  async function handleImport() {
    setImportError(null);
    try {
      const importedId = await importTheme();
      if (importedId) onImported(importedId);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Import failed");
    }
  }

  return (
    <div className="theme-customizer__overlay">
      <div className="theme-customizer" ref={panelRef} role="dialog" aria-label={`Customize ${theme.label}`}>
        <h3 className="theme-customizer__title">Customize {theme.label}</h3>

        <label className="theme-customizer__row">
          <span>Stain colour</span>
          <div className="theme-customizer__tint-row">
            <input
              type="color"
              value={tint || DEFAULT_TINT}
              onChange={(e) => {
                setTint(e.target.value);
                apply({ tint: e.target.value });
              }}
            />
            {tint && (
              <button
                type="button"
                className="theme-customizer__clear"
                onClick={() => {
                  setTint("");
                  setThemeCustomization(theme.id, { tint: undefined });
                }}
              >
                Clear
              </button>
            )}
          </div>
        </label>

        <label className="theme-customizer__row">
          <span>Font size ({Math.round(fontScale * 100)}%)</span>
          <input
            type="range"
            min="0.8"
            max="1.3"
            step="0.05"
            value={fontScale}
            onChange={(e) => {
              const next = parseFloat(e.target.value);
              setFontScale(next);
              apply({ fontScale: next });
            }}
          />
        </label>

        <label className="theme-customizer__row">
          <span>Corner radius ({radius}px)</span>
          <input
            type="range"
            min="0"
            max="28"
            step="1"
            value={radius}
            onChange={(e) => {
              const next = parseInt(e.target.value, 10);
              setRadius(next);
              apply({ radius: next });
            }}
          />
        </label>

        <label className="theme-customizer__row">
          <span>Widget border</span>
          <select
            value={borderStyle}
            onChange={(e) => {
              const next = e.target.value as BorderStyleId | "";
              setBorderStyle(next);
              setThemeCustomization(theme.id, { borderStyle: next || undefined });
            }}
          >
            <option value="">Theme default</option>
            {BORDER_STYLES.map((id) => (
              <option key={id} value={id}>
                {BORDER_STYLE_LABELS[id]}
              </option>
            ))}
          </select>
        </label>

        <div className="theme-customizer__io">
          <button type="button" onClick={handleExport}>
            Export as .nanotheme
          </button>
          <button type="button" onClick={handleImport}>
            Import .nanotheme
          </button>
        </div>
        {importError && <p className="theme-customizer__error">{importError}</p>}

        <div className="theme-customizer__actions">
          <button type="button" className="theme-customizer__btn theme-customizer__btn--secondary" onClick={handleReset}>
            Reset
          </button>
          <button type="button" className="theme-customizer__btn theme-customizer__btn--primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
