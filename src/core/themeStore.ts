import { getSetting, setSetting } from "../storage/settings";
import { DEFAULT_THEME, isThemeId, ThemeId } from "../themes/themes";

/** Minimal external store (same shape as focusModeStore) for the active theme, persisted via app_settings. */
type Listener = () => void;

const THEME_SETTING_KEY = "theme";

let theme: ThemeId = DEFAULT_THEME;
let loaded = false;
const listeners = new Set<Listener>();

function applyToDocument(next: ThemeId) {
  document.documentElement.dataset.theme = next;
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
