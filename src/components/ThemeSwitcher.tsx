import { useEffect, useState } from "react";
import { getTheme, initTheme, setTheme, subscribeTheme } from "../core/themeStore";
import { THEMES } from "../themes/themes";
import "./ThemeSwitcher.css";

/** Minimal floating control to hot-swap the active theme — no reload required. */
export function ThemeSwitcher() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(getTheme());

  useEffect(() => {
    initTheme().catch((err) => console.error("theme init failed", err));
    return subscribeTheme(() => setActive(getTheme()));
  }, []);

  return (
    <div className="theme-switcher">
      <button
        className="theme-switcher__btn"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Change theme"
      >
        🎨
      </button>
      {open && (
        <div className="theme-switcher__menu" role="menu">
          {THEMES.map((t) => (
            <button
              key={t.id}
              role="menuitemradio"
              aria-checked={active === t.id}
              className={`theme-switcher__option ${active === t.id ? "is-active" : ""}`}
              onClick={() => {
                setTheme(t.id);
                setOpen(false);
              }}
            >
              <span className="theme-switcher__option-label">{t.label}</span>
              <span className="theme-switcher__option-desc">{t.description}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
