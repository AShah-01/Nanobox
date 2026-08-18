import { useEffect, useRef, useState } from "react";
import { THEMES } from "../themes/themes";
import { getTheme, setTheme } from "../core/themeStore";
import "./SettingsPanel.css";

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const [theme, setThemeLocal] = useState(getTheme());
  const [accentColor, setAccentColor] = useState(localStorage.getItem("settings:accentColor") || "#7c9cff");
  const [fontSize, setFontSize] = useState(parseFloat(localStorage.getItem("settings:fontSize") || "1"));
  const [opacity, setOpacity] = useState(parseFloat(localStorage.getItem("settings:opacity") || "1"));
  const [autostart, setAutostart] = useState(localStorage.getItem("settings:autostart") === "true");
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onClose]);

  function saveSettings() {
    setTheme(theme);
    localStorage.setItem("settings:accentColor", accentColor);
    localStorage.setItem("settings:fontSize", fontSize.toString());
    localStorage.setItem("settings:opacity", opacity.toString());
    localStorage.setItem("settings:autostart", autostart.toString());
    document.documentElement.style.setProperty("--nb-accent", accentColor);
    document.documentElement.style.setProperty("font-size", `${fontSize * 100}%`);
    document.documentElement.style.setProperty("opacity", opacity.toString());
    onClose();
  }

  function resetToDefaults() {
    setThemeLocal(getTheme());
    setAccentColor("#7c9cff");
    setFontSize(1);
    setOpacity(1);
    setAutostart(false);
  }

  if (!open) return null;

  return (
    <div className="settings-panel__overlay">
      <div className="settings-panel" ref={panelRef}>
        <div className="settings-panel__header">
          <h1 className="settings-panel__title">Settings</h1>
          <button className="settings-panel__close" onClick={onClose} aria-label="Close settings">
            ✕
          </button>
        </div>

        <div className="settings-panel__content">
          {/* Theme Selector */}
          <div className="settings-section">
            <label className="settings-section__label">Theme</label>
            <div className="settings-section__options">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  className={`theme-option ${theme === t.id ? "is-active" : ""}`}
                  onClick={() => setThemeLocal(t.id)}
                  title={t.description}
                >
                  <span className="theme-option__label">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Accent Color Picker */}
          <div className="settings-section">
            <div className="settings-section__row">
              <label htmlFor="accent-color" className="settings-section__label">
                Accent Color
              </label>
              <div className="color-picker">
                <input
                  id="accent-color"
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="color-picker__input"
                />
                <span className="color-picker__value">{accentColor}</span>
              </div>
            </div>
          </div>

          {/* Font Size Slider */}
          <div className="settings-section">
            <div className="settings-section__row">
              <label htmlFor="font-size" className="settings-section__label">
                Font Size
              </label>
              <div className="slider-group">
                <input
                  id="font-size"
                  type="range"
                  min="0.8"
                  max="1.3"
                  step="0.05"
                  value={fontSize}
                  onChange={(e) => setFontSize(parseFloat(e.target.value))}
                  className="slider-group__slider"
                />
                <span className="slider-group__value">{Math.round(fontSize * 100)}%</span>
              </div>
            </div>
          </div>

          {/* Opacity Slider */}
          <div className="settings-section">
            <div className="settings-section__row">
              <label htmlFor="opacity" className="settings-section__label">
                Window Opacity
              </label>
              <div className="slider-group">
                <input
                  id="opacity"
                  type="range"
                  min="0.5"
                  max="1"
                  step="0.05"
                  value={opacity}
                  onChange={(e) => setOpacity(parseFloat(e.target.value))}
                  className="slider-group__slider"
                />
                <span className="slider-group__value">{Math.round(opacity * 100)}%</span>
              </div>
            </div>
          </div>

          {/* Autostart Toggle */}
          <div className="settings-section">
            <div className="settings-section__row">
              <label htmlFor="autostart" className="settings-section__label">
                Launch on startup
              </label>
              <label className="toggle-switch">
                <input
                  id="autostart"
                  type="checkbox"
                  checked={autostart}
                  onChange={(e) => setAutostart(e.target.checked)}
                  className="toggle-switch__input"
                />
                <span className="toggle-switch__slider" />
              </label>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="settings-panel__actions">
          <button className="settings-panel__btn settings-panel__btn--secondary" onClick={resetToDefaults}>
            Reset to Defaults
          </button>
          <div className="settings-panel__actions-right">
            <button className="settings-panel__btn" onClick={onClose}>
              Cancel
            </button>
            <button className="settings-panel__btn settings-panel__btn--primary" onClick={saveSettings}>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
