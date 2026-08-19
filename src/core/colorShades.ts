/** Derives a small per-widget palette from one user-picked colour — that colour becomes the widget's accent. */
export interface ColorShades {
  accent: string;
  accentText: string;
  surfaceAlt: string;
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const num = parseInt(full, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  switch (max) {
    case rn:
      h = (gn - bn) / d + (gn < bn ? 6 : 0);
      break;
    case gn:
      h = (bn - rn) / d + 2;
      break;
    default:
      h = (rn - gn) / d + 4;
  }
  return [h * 60, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let [r, g, b] = [0, 0, 0];
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  const toHex = (n: number) =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function deriveShades(hex: string): ColorShades {
  const [r, g, b] = hexToRgb(hex);
  const [h, s, l] = rgbToHsl(r, g, b);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // `surfaceAlt` is a panel background that needs to read as a distinct
  // surface behind the picked colour, while still tracking it. This used to
  // be hardcoded to a fixed dark lightness (0.16) regardless of the input,
  // so even a bright pastel produced a near-black panel. Instead, offset
  // from the input's own HSL lightness — light colours get a lighter (but
  // still separated) panel, dark colours get a slightly-lifted dark panel —
  // clamped so neither end collapses to pure black or pure white.
  const surfaceL = Math.min(Math.max(l > 0.5 ? l - 0.32 : l + 0.1, 0.09), 0.88);

  return {
    accent: hex,
    accentText: luminance > 0.55 ? "#0d0f16" : "#f5f5f5",
    surfaceAlt: hslToHex(h, Math.min(s, 0.45), surfaceL),
  };
}
