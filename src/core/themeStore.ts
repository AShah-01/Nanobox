import { getSetting, setSetting } from "../storage/settings";
import { DEFAULT_THEME, isThemeId, ThemeId } from "../themes/themes";
import { deriveShades } from "./colorShades";

/** Minimal external store (same shape as focusModeStore) for the active theme, persisted via app_settings. */
type Listener = () => void;

const THEME_SETTING_KEY = "theme";
const TINT_STORAGE_PREFIX = "settings:themeTint:";

let theme: ThemeId = DEFAULT_THEME;
let loaded = false;
const listeners = new Set<Listener>();

function tintStorageKey(id: ThemeId): string {
  return `${TINT_STORAGE_PREFIX}${id}`;
}

/** Reads the stored "stain" colour for a given theme, if the user picked one. */
export function getThemeTint(id: ThemeId): string | null {
  try {
    return localStorage.getItem(tintStorageKey(id));
  } catch (err) {
    console.error("failed to read theme tint", err);
    return null;
  }
}

/** Stores (or clears, when hex is null) the "stain" colour for a given theme and re-applies live if it's active. */
export function setThemeTint(id: ThemeId, hex: string | null) {
  try {
    if (hex) {
      localStorage.setItem(tintStorageKey(id), hex);
    } else {
      localStorage.removeItem(tintStorageKey(id));
    }
  } catch (err) {
    console.error("failed to persist theme tint", err);
  }
  if (id === theme) {
    applyTint(id);
  }
}

/**
 * Applies (or clears) a theme's stored tint as inline overrides on top of
 * whichever theme CSS just loaded — same mechanism as the global accent-color
 * picker and the per-widget colour picker, just scoped to <html> per-theme.
 */
function applyTint(id: ThemeId) {
  const tint = getThemeTint(id);
  const root = document.documentElement.style;
  if (tint) {
    const shades = deriveShades(tint);
    root.setProperty("--nb-accent", shades.accent);
    root.setProperty("--nb-accent-text", shades.accentText);
    root.setProperty("--nb-surface-alt", shades.surfaceAlt);
  } else {
    root.removeProperty("--nb-accent");
    root.removeProperty("--nb-accent-text");
    root.removeProperty("--nb-surface-alt");
  }
}

function applyToDocument(next: ThemeId) {
  document.documentElement.dataset.theme = next;
  applyTint(next);
}

export function getTheme(): ThemeId {
  return theme;
}

export function setTheme(next: ThemeId) {
  theme = next;
  applyToDocument(next);
  listeners.forEach((l) => l());
  setSetting(THEME_SETTING_KEY, next).catch((err) => console.error("failed to save theme", err));
}

export function subscribeTheme(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Loads the persisted theme (if any) and applies it. Call once on app startup. */
export async function initTheme(): Promise<void> {
  if (loaded) return;
  loaded = true;
  applyToDocument(theme);
  try {
    const saved = await getSetting(THEME_SETTING_KEY);
    if (isThemeId(saved) && saved !== theme) {
      theme = saved;
      applyToDocument(theme);
      listeners.forEach((l) => l());
    }
  } catch (err) {
    console.error("failed to load saved theme", err);
  }
}
