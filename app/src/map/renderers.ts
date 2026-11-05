import ClassBreaksRenderer from "@arcgis/core/renderers/ClassBreaksRenderer";
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol";
import type { FormatId, MetricId } from "../data";
import {
  divRamp,
  indexBreaks,
  indexClassLabels,
  pctBreaks,
  pctClassLabels,
  seqRamp,
} from "../config/branding";

export const metricField = (metric: MetricId, format: FormatId): string => {
  if (metric === "total") return format === "pct" ? "total_pct" : "total_index";
  return { access_to: "idx_at", access_within: "idx_aw", quality: "idx_q", benefits: "idx_b" }[
    metric
  ];
};

const fill = (color: string) =>
  new SimpleFillSymbol({
    color,
    outline: { color: "rgba(8, 29, 40, 0.9)", width: 1.1 },
  });

/**
 * Defined (manual) class breaks — identical across geographies/views so maps
 * stay comparable (classification is an analytical choice, stated in the
 * legend and methodology panel; Jenks would not be comparable across themes).
 */
export function buildRenderer(metric: MetricId, format: FormatId): ClassBreaksRenderer {
  const useIndex = metric !== "total" || format === "index";
  const breaks = useIndex ? indexBreaks : pctBreaks;
  const ramp = useIndex ? divRamp : seqRamp;
  const labels = useIndex ? indexClassLabels : pctClassLabels;
  const edges = [-Infinity, ...breaks, Infinity];
  return new ClassBreaksRenderer({
    field: metricField(metric, format),
    classBreakInfos: ramp.map((color, i) => ({
      minValue: edges[i] === -Infinity ? -9999 : edges[i],
      maxValue: edges[i + 1] === Infinity ? 9999 : edges[i + 1] - 0.000001,
      symbol: fill(color),
      label: labels[i],
    })),
  });
}

/**
 * Postcode geographies have no open-licence boundaries, so published results
 * render as MARKERS at postcode reference points — the same defined class
 * breaks and ramp as the council choropleth, on circles instead of fills.
 * Returned as an autocast object (constructed ClassBreaksRenderer instances
 * fail silently on FeatureLayer in SDK 5.1.27 — see buildSdzRenderer).
 */
export function buildPointRenderer(metric: MetricId, format: FormatId): ClassBreaksRenderer {
  const useIndex = metric !== "total" || format === "index";
  const breaks = useIndex ? indexBreaks : pctBreaks;
  const ramp = useIndex ? divRamp : seqRamp;
  const labels = useIndex ? indexClassLabels : pctClassLabels;
  const edges = [-Infinity, ...breaks, Infinity];
  return {
    type: "class-breaks",
    field: metricField(metric, format),
    classBreakInfos: ramp.map((color, i) => ({
      minValue: edges[i] === -Infinity ? -9999 : edges[i],
      maxValue: edges[i + 1] === Infinity ? 9999 : edges[i + 1] - 0.000001,
      symbol: {
        type: "simple-marker",
        style: "circle",
        size: 11,
        color,
        outline: { color: "rgba(8, 29, 40, 0.95)", width: 1.4 },
      },
      label: labels[i],
    })),
  } as unknown as ClassBreaksRenderer;
}

/** % of households within 400 m of greenspace/trails — blue sequential, 0–100. */
export const sdzRamp = ["#17303F", "#1E4A66", "#2A6A92", "#3E93C4", "#7FAEF5"];
export const sdzBreaks = [20, 40, 60, 80];
export const sdzLabels = ["Under 20%", "20–40%", "40–60%", "60–80%", "80% and above"];

/**
 * Returned as an autocast properties object, not a constructed instance:
 * live-debugging on the deployed app showed a constructed ClassBreaksRenderer
 * silently rendering nothing on this FeatureLayer in SDK 5.1.27, while the
 * identical autocast object (the SDK's documented path) draws correctly.
 */
export function buildSdzRenderer(field: "Percent400" | "Percent1km" | "Percent2km" = "Percent400"): ClassBreaksRenderer {
  const edges = [-1, ...sdzBreaks, 101];
  return {
    type: "class-breaks",
    field,
    classBreakInfos: sdzRamp.map((color, i) => ({
      minValue: edges[i],
      maxValue: edges[i + 1] === 101 ? 101 : edges[i + 1] - 0.000001,
      symbol: {
        type: "simple-fill",
        color,
        outline: { color: "rgba(8, 29, 40, 0.5)", width: 0.3 },
      },
      label: sdzLabels[i],
    })),
  } as unknown as ClassBreaksRenderer;
}

export function legendEntries(metric: MetricId, format: FormatId) {
  const useIndex = metric !== "total" || format === "index";
  const ramp = useIndex ? divRamp : seqRamp;
  const labels = useIndex ? indexClassLabels : pctClassLabels;
  return ramp.map((color, i) => ({ color, label: labels[i] }));
}
