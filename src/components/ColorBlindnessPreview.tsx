/**
 * Self-check tool, not a persisted accessibility setting: lets a user preview
 * the *currently active* theme (whatever it is) through an approximation of
 * common colour-vision differences, so they can judge for themselves whether
 * their chosen theme/tint/accent combination still reads clearly. Resets on
 * reload by design — it previews, it doesn't change, anything real.
 */
export type ColorBlindnessMode = "none" | "protanopia" | "deuteranopia" | "tritanopia" | "achromatopsia";

const FILTER_ID_PREFIX = "nb-colorblind-";

/** Standard published approximation matrices (Brettel/Viénot-style) for each dichromacy/monochromacy type. */
const MATRICES: Record<Exclude<ColorBlindnessMode, "none">, string> = {
  protanopia: "0.567 0.433 0 0 0  0.558 0.442 0 0 0  0 0.242 0.758 0 0  0 0 0 1 0",
  deuteranopia: "0.625 0.375 0 0 0  0.7 0.3 0 0 0  0 0.3 0.7 0 0  0 0 0 1 0",
  tritanopia: "0.95 0.05 0 0 0  0 0.433 0.567 0 0  0 0.475 0.525 0 0  0 0 0 1 0",
  achromatopsia: "0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0 0 0 1 0",
};

/** Applies (or clears) the preview filter on the document root. Call whenever the selected mode changes. */
export function applyColorBlindnessPreview(mode: ColorBlindnessMode) {
  document.documentElement.style.filter = mode === "none" ? "" : `url(#${FILTER_ID_PREFIX}${mode})`;
}

/** Hidden SVG holding the filter definitions `applyColorBlindnessPreview` references. Mount once, anywhere. */
export function ColorBlindnessFilters() {
  return (
    <svg aria-hidden="true" style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}>
      <defs>
        {(Object.keys(MATRICES) as Array<keyof typeof MATRICES>).map((mode) => (
          <filter key={mode} id={`${FILTER_ID_PREFIX}${mode}`}>
            <feColorMatrix type="matrix" values={MATRICES[mode]} />
          </filter>
        ))}
      </defs>
    </svg>
  );
}
