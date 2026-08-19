export type ThemeId =
  | "liquid-glass"
  | "matte"
  | "glossy"
  | "retro"
  | "cyberpunk"
  | "steampunk"
  | "standard"
  | "nord"
  | "dracula"
  | "solarized"
  | "forest"
  | "ocean"
  | "sunset"
  | "monochrome"
  | "cotton-candy"
  | "industrial"
  | "galaxy";

export interface ThemeMeta {
  id: ThemeId;
  label: string;
  description: string;
}

export const DEFAULT_THEME: ThemeId = "matte";

export const THEMES: ThemeMeta[] = [
  { id: "liquid-glass", label: "Liquid Glass", description: "Frosted translucency, soft blur" },
  { id: "matte", label: "Matte", description: "Flat, paper-like, high contrast" },
  { id: "glossy", label: "Glossy", description: "Bevelled Aqua-era shine" },
  { id: "retro", label: "Retro", description: "CRT terminal, green phosphor" },
  { id: "cyberpunk", label: "Cyberpunk", description: "Neon noir with scanlines" },
  { id: "steampunk", label: "Steampunk", description: "Victorian brass and gears" },
  { id: "standard", label: "Standard", description: "Plain neutral baseline, nothing extra" },
  { id: "nord", label: "Nord", description: "Arctic polar-night blues" },
  { id: "dracula", label: "Dracula", description: "Purple-forward dark editor theme" },
  { id: "solarized", label: "Solarized Dark", description: "Low-contrast, eye-friendly dark" },
  { id: "forest", label: "Forest", description: "Deep greens and earthy browns" },
  { id: "ocean", label: "Deep Ocean", description: "Calm deep-sea navy and aqua" },
  { id: "sunset", label: "Sunset", description: "Warm plum, orange and pink" },
  { id: "monochrome", label: "Monochrome", description: "Pure grayscale, no hue at all" },
  { id: "cotton-candy", label: "Cotton Candy", description: "Soft airy pastels" },
  { id: "industrial", label: "Industrial", description: "Utilitarian gray with safety orange" },
  { id: "galaxy", label: "Galaxy", description: "Deep space with nebula violet" },
];

export function isThemeId(value: string | null): value is ThemeId {
  return THEMES.some((t) => t.id === value);
}
