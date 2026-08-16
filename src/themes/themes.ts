export type ThemeId = "liquid-glass" | "matte" | "glossy" | "retro" | "cyberpunk" | "steampunk";

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
];

export function isThemeId(value: string | null): value is ThemeId {
  return THEMES.some((t) => t.id === value);
}
