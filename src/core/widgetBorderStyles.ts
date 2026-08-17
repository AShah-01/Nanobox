/** Per-widget border presets, matching PRODUCT_SPEC.md's theme-level vocabulary (none/hairline/thick/engraved). */
export const BORDER_STYLES = ["none", "hairline", "thick", "engraved"] as const;
export type BorderStyleId = (typeof BORDER_STYLES)[number];

export const BORDER_STYLE_LABELS: Record<BorderStyleId, string> = {
  none: "None",
  hairline: "Hairline",
  thick: "Thick",
  engraved: "Engraved",
};

export function borderStyleCss(id: BorderStyleId, accent: string): { border: string; boxShadow: string } {
  switch (id) {
    case "none":
      return { border: "none", boxShadow: "none" };
    case "hairline":
      return { border: `1px solid ${accent}66`, boxShadow: "none" };
    case "thick":
      return { border: `3px solid ${accent}`, boxShadow: "none" };
    case "engraved":
      return {
        border: `1px solid ${accent}33`,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.35)",
      };
  }
}
