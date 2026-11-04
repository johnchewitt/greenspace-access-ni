/**
 * Greenspace Access NI — brand tokens.
 * The seven brief colours plus one extension hue ("lough blue") added so four
 * data series stay distinguishable (brief palette has three light hues that
 * collide under CVD simulation; see palette validation note below).
 */
export const APP_NAME = "Greenspace Access NI";
export const APP_SUBTITLE =
  "Understanding Access, Quality & Wellbeing Across Northern Ireland";

export const palette = {
  forest: "#092B25",
  emerald: "#06483D",
  navy: "#081D28",
  turquoise: "#43DCC1",
  lime: "#B8E883",
  gold: "#E2B76B",
  cream: "#F2F4E9",
  /** extension hue for the 4-series chart palette */
  lough: "#7FAEF5",
} as const;

/**
 * Chart series colours for the four themes, in report order.
 * Validated (dataviz six-checks, dark surface #081D28): chroma, CVD separation
 * (worst adjacent ΔE 12.9 protan / 14.0 tritan), normal-vision floor 15.5,
 * contrast ≥3:1 — all pass. Lightness band sits deliberately brighter
 * (0.75–0.88) than the reference system's dark band: brand parameter for the
 * luminous-on-midnight look; cohesion width matches the reference band.
 */
export const themeSeries = {
  access_to: "#3BCDB4",
  access_within: "#B8E883",
  quality: "#7FAEF5",
  benefits: "#E2A95B",
  total: "#43DCC1",
} as const;

/** Sequential ramp (percentage of maximum), low → high, luminance-monotonic. */
export const seqRamp = ["#0D3B33", "#14584A", "#1E7A63", "#2DA583", "#43DCC1"];

/**
 * Diverging ramp (index, NI average = 100): amber below ↔ turquoise above,
 * muted neutral centre. Amber/teal poles are CVD-safe; centre class is the
 * honest "around average" band (±2 index points ≪ survey margins of error).
 */
export const divRamp = ["#E8A94F", "#9C8456", "#51625D", "#2FA98A", "#43DCC1"];

/** Defined (manual) class breaks — identical across geographies and views. */
export const indexBreaks = [96, 98, 102, 104]; // <96 | 96–98 | 98–102 | 102–104 | ≥104
export const pctBreaks = [74, 76, 78, 80]; // <74 | 74–76 | 76–78 | 78–80 | ≥80

export const indexClassLabels = [
  "Well below NI average (<96)",
  "Below average (96–98)",
  "Around average (98–102)",
  "Above average (102–104)",
  "Well above NI average (≥104)",
];
export const pctClassLabels = [
  "Below 74%",
  "74–76%",
  "76–78%",
  "78–80%",
  "80% and above",
];

export const ink = {
  primary: "#F2F4E9",
  secondary: "rgba(242,244,233,0.72)",
  muted: "rgba(242,244,233,0.5)",
  faint: "rgba(242,244,233,0.28)",
} as const;
