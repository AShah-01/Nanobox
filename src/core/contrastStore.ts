import { getSetting, setSetting } from "../storage/settings";

/** Minimal external store (same shape as themeStore/focusModeStore) for the high-contrast toggle. */
type Listener = () => void;

const CONTRAST_SETTING_KEY = "highContrast";

let highContrast = false;
let loaded = false;
const listeners = new Set<Listener>();

function applyToDocument(next: boolean) {
  if (next) {
    document.documentElement.dataset.contrast = "high";
  } else {
    delete document.documentElement.dataset.contrast;
  }
}

export function isHighContrast(): boolean {
  return highContrast;
}

export function setHighContrast(next: boolean) {
  highContrast = next;
  applyToDocument(next);
  listeners.forEach((l) => l());
  setSetting(CONTRAST_SETTING_KEY, String(next)).catch((err) => console.error("failed to save contrast setting", err));
}

export function subscribeContrast(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Loads the persisted preference (if any) and applies it. Call once on app startup. */
export async function initContrast(): Promise<void> {
  if (loaded) return;
  loaded = true;
  try {
    const saved = await getSetting(CONTRAST_SETTING_KEY);
    if (saved === "true") {
      highContrast = true;
      applyToDocument(true);
      listeners.forEach((l) => l());
    }
  } catch (err) {
    console.error("failed to load saved contrast setting", err);
  }
}
