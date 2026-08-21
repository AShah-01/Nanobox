const STORAGE_KEY = "settings:colorblindPalette";
const ATTR = "data-colorblind";

// Okabe-Ito universal palette — distinguishable for protanopia, deuteranopia,
// and tritanopia alike. Used as the accent when the palette mode is on.
const COLORBLIND_ACCENT = "#0072B2";      // blue
const COLORBLIND_ACCENT_TEXT = "#ffffff";
const COLORBLIND_SURFACE_ALT = "#003F6B"; // darker blue tint for surfaces

export function isColorblindPalette(): boolean {
  return localStorage.getItem(STORAGE_KEY) === "true";
}

export function setColorblindPalette(enabled: boolean): void {
  localStorage.setItem(STORAGE_KEY, String(enabled));
  applyColorblindPalette(enabled);
}

export function applyColorblindPalette(enabled: boolean): void {
  const root = document.documentElement;
  if (enabled) {
    root.setAttribute(ATTR, "true");
    root.style.setProperty("--nb-accent", COLORBLIND_ACCENT);
    root.style.setProperty("--nb-accent-text", COLORBLIND_ACCENT_TEXT);
    root.style.setProperty("--nb-surface-alt", COLORBLIND_SURFACE_ALT);
  } else {
    root.removeAttribute(ATTR);
    root.style.removeProperty("--nb-accent");
    root.style.removeProperty("--nb-accent-text");
    root.style.removeProperty("--nb-surface-alt");
  }
}

/** Call once on startup to restore the saved preference. */
export function initColorblindPalette(): void {
  applyColorblindPalette(isColorblindPalette());
}
