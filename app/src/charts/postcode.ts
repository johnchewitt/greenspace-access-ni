import type { EChartsCoreOption } from "echarts/core";
import {
  postcodeAreas,
  postcodeSectors,
  ni,
  type FormatId,
} from "../data";
import { divRamp, indexBreaks, ink, pctBreaks, seqRamp } from "../config/branding";

const font = "Manrope, sans-serif";

export type PostcodeKind = "areas" | "sectors";

export interface PostcodeRow {
  code: string;
  place: string;
  pct: number;
  index: number;
  n: number;
}

export function postcodeRows(kind: PostcodeKind): PostcodeRow[] {
  return kind === "areas"
    ? postcodeAreas.map((r) => ({
        code: r.postcode_area,
        place: r.place,
        pct: r.total_pct,
        index: r.total_index,
        n: r.sample_n,
      }))
    : postcodeSectors.map((r) => ({
        code: r.postcode_sector,
        place: r.place,
        pct: r.total_pct,
        index: r.total_index,
        n: r.sample_n,
      }));
}

/** Colour by the SAME defined class bands as the maps — bands, not ranks. */
function classColor(value: number, useIndex: boolean): string {
  const breaks = useIndex ? indexBreaks : pctBreaks;
  const ramp = useIndex ? divRamp : seqRamp;
  let i = 0;
  while (i < breaks.length && value >= breaks[i]) i++;
  return ramp[i];
}

/**
 * Chart-first postcode results (no boundaries exist under open licence).
 * Values are banded by the defined classes and carry sample sizes; the report's
 * margins of error mean small differences and adjacent positions are not
 * meaningful — framing the view as bands rather than a league table.
 */
export function postcodeOption(kind: PostcodeKind, format: FormatId): EChartsCoreOption {
  const useIndex = format === "index";
  const rows = [...postcodeRows(kind)].sort((a, b) =>
    useIndex ? a.index - b.index : a.pct - b.pct,
  );
  const niLine = useIndex ? 100 : ni.totalPct;
  const vals = rows.map((r) => (useIndex ? r.index : r.pct));
  const lo = Math.floor(Math.min(...vals, niLine) - 2);
  const hi = Math.ceil(Math.max(...vals, niLine) + 2);
  return {
    textStyle: { fontFamily: font, color: ink.secondary },
    grid: { left: 8, right: 40, top: 20, bottom: 24, containLabel: true },
    xAxis: {
      type: "value",
      min: lo,
      max: hi,
      axisLine: { lineStyle: { color: "rgba(242,244,233,0.14)" } },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: "rgba(242,244,233,0.07)" } },
      axisLabel: {
        color: ink.muted,
        fontFamily: font,
        fontSize: 10.5,
        formatter: (v: number) => (useIndex ? `${v}` : `${v}%`),
      },
    },
    yAxis: {
      type: "category",
      data: rows.map((r) => `${r.code} · ${r.place}`),
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { color: ink.secondary, fontFamily: font, fontSize: 10.5 },
    },
    series: [
      {
        type: "bar",
        barWidth: 9,
        data: rows.map((r) => ({
          value: useIndex ? +r.index.toFixed(1) : +r.pct.toFixed(1),
          row: r,
          itemStyle: {
            color: classColor(useIndex ? r.index : r.pct, useIndex),
            borderRadius: [0, 3, 3, 0],
          },
        })),
        markLine: {
          symbol: "none",
          lineStyle: { color: ink.muted, type: "dashed", width: 1 },
          label: {
            formatter: useIndex ? "NI = 100" : `NI ${ni.totalPct}%`,
            color: ink.muted,
            fontFamily: font,
            fontSize: 10,
            position: "end",
            distance: 4,
          },
          data: [{ xAxis: niLine }],
        },
      },
    ],
    tooltip: {
      backgroundColor: "rgba(8,29,40,0.94)",
      borderColor: "rgba(67,220,193,0.25)",
      textStyle: { color: ink.primary, fontFamily: font, fontSize: 12 },
      confine: true,
      formatter: (p: { data: { row: PostcodeRow } }) => {
        const r = p.data.row;
        return (
          `<b>${r.code}</b> · ${r.place}<br/>` +
          `Overall ${r.pct.toFixed(1)}% of maximum · index ${r.index.toFixed(1)}<br/>` +
          `n = ${r.n} respondents · 95% MoE ≈ ±8–18pp at these sample sizes`
        );
      },
    },
  };
}
