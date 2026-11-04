import type { EChartsCoreOption } from "echarts/core";
import {
  THEME_ORDER,
  THEME_SHORT,
  classifications,
  lgd,
  lgdByCode,
  LGD_DISPLAY,
  ni,
  surveyInputs,
  type FormatId,
  type MetricId,
  type ThemeId,
} from "../data";
import { ink, palette, themeSeries } from "../config/branding";

const font = "Manrope, sans-serif";

const base = {
  textStyle: { fontFamily: font, color: ink.secondary },
  tooltip: {
    backgroundColor: "rgba(8,29,40,0.94)",
    borderColor: "rgba(67,220,193,0.25)",
    textStyle: { color: ink.primary, fontFamily: font, fontSize: 12 },
    confine: true,
  },
};

const axisCommon = {
  axisLine: { lineStyle: { color: "rgba(242,244,233,0.14)" } },
  axisTick: { show: false },
  axisLabel: { color: ink.muted, fontFamily: font, fontSize: 10.5 },
  splitLine: { lineStyle: { color: "rgba(242,244,233,0.07)" } },
};

export const metricValue = (code: string, metric: MetricId, format: FormatId): number => {
  const r = lgdByCode[code];
  if (metric === "total") return format === "pct" ? r.total_pct : r.total_index;
  return r.themes_index[metric];
};

/** Horizontal ranked bars — all 11 councils for the current metric/format. */
export function councilRankOption(
  metric: MetricId,
  format: FormatId,
  selectedCode: string | null,
): EChartsCoreOption {
  const useIndex = metric !== "total" || format === "index";
  const rows = [...lgd]
    .map((r) => ({
      code: r.lad_code,
      name: LGD_DISPLAY[r.lad_code],
      value: metricValue(r.lad_code, metric, format),
    }))
    .sort((a, b) => a.value - b.value);
  const niLine = useIndex ? 100 : ni.totalPct;
  const vals = rows.map((r) => r.value);
  const lo = Math.floor(Math.min(...vals, niLine) - 2);
  const hi = Math.ceil(Math.max(...vals, niLine) + 2);
  return {
    ...base,
    grid: { left: 8, right: 34, top: 24, bottom: 22, containLabel: true },
    xAxis: {
      type: "value",
      ...axisCommon,
      min: lo,
      max: hi,
      axisLabel: { ...axisCommon.axisLabel, formatter: (v: number) => (useIndex ? `${v}` : `${v}%`) },
    },
    yAxis: {
      type: "category",
      data: rows.map((r) => r.name),
      ...axisCommon,
      axisLabel: { ...axisCommon.axisLabel, fontSize: 11, color: ink.secondary },
      splitLine: { show: false },
    },
    series: [
      {
        type: "bar",
        data: rows.map((r) => ({
          value: r.value,
          code: r.code,
          itemStyle: {
            color: r.code === selectedCode ? palette.gold : themeSeries[metric],
            opacity: selectedCode && r.code !== selectedCode ? 0.45 : 1,
            borderRadius: [0, 4, 4, 0],
          },
        })),
        barWidth: 13,
        label: {
          show: true,
          position: "right",
          color: ink.secondary,
          fontFamily: font,
          fontSize: 10.5,
          formatter: ({ value }: { value: number }) =>
            useIndex ? (value as number).toFixed(metric === "total" ? 1 : 0) : `${(value as number).toFixed(1)}%`,
        },
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
  };
}

/** Four theme indices for one council, against the NI = 100 reference. */
export function areaThemesOption(code: string): EChartsCoreOption {
  const r = lgdByCode[code];
  return {
    ...base,
    grid: { left: 4, right: 16, top: 18, bottom: 4, containLabel: true },
    xAxis: {
      type: "value",
      min: 80,
      max: 115,
      ...axisCommon,
    },
    yAxis: {
      type: "category",
      data: THEME_ORDER.map((t) => THEME_SHORT[t]).reverse(),
      ...axisCommon,
      splitLine: { show: false },
      axisLabel: { ...axisCommon.axisLabel, fontSize: 11, color: ink.secondary },
    },
    series: [
      {
        type: "bar",
        barWidth: 12,
        data: [...THEME_ORDER].reverse().map((t) => ({
          value: r.themes_index[t],
          itemStyle: { color: themeSeries[t], borderRadius: [0, 4, 4, 0] },
        })),
        label: {
          show: true,
          position: "right",
          color: ink.primary,
          fontFamily: font,
          fontSize: 11,
          fontWeight: 700,
        },
        markLine: {
          symbol: "none",
          lineStyle: { color: ink.muted, type: "dashed", width: 1 },
          label: { formatter: "NI 100", color: ink.muted, fontSize: 9.5, fontFamily: font },
          data: [{ xAxis: 100 }],
        },
      },
    ],
    tooltip: {
      ...base.tooltip,
      formatter: (p: { name: string; value: number }) =>
        `${p.name}: index <b>${p.value}</b> (NI average = 100)`,
    },
  };
}

/** Radar — selected council's theme indices vs NI average. */
export function areaRadarOption(code: string): EChartsCoreOption {
  const r = lgdByCode[code];
  return {
    ...base,
    legend: {
      bottom: 0,
      textStyle: { color: ink.secondary, fontFamily: font, fontSize: 11 },
      itemWidth: 12,
      itemHeight: 8,
    },
    radar: {
      indicator: THEME_ORDER.map((t) => ({ name: THEME_SHORT[t], max: 125, min: 75 })),
      splitArea: { show: false },
      axisLine: { lineStyle: { color: "rgba(242,244,233,0.12)" } },
      splitLine: { lineStyle: { color: "rgba(242,244,233,0.1)" } },
      axisName: { color: ink.secondary, fontFamily: font, fontSize: 11 },
      radius: "58%",
    },
    series: [
      {
        type: "radar",
        data: [
          {
            name: "NI average (100)",
            value: THEME_ORDER.map(() => 100),
            lineStyle: { color: ink.muted, width: 1.4, type: "dashed" },
            itemStyle: { color: ink.muted },
            areaStyle: { color: "rgba(242,244,233,0.04)" },
            symbolSize: 0,
          },
          {
            name: LGD_DISPLAY[code],
            value: THEME_ORDER.map((t) => r.themes_index[t]),
            lineStyle: { color: palette.gold, width: 2 },
            itemStyle: { color: palette.gold },
            areaStyle: { color: "rgba(226,183,107,0.14)" },
            symbolSize: 4,
          },
        ],
      },
    ],
  };
}

/** Q14 statement response distributions (NI level) — stacked horizontal bars. */
export function q14Option(): EChartsCoreOption {
  const dist = (surveyInputs as {
    q14: { response_distributions: Record<string, Record<string, number>> };
  }).q14.response_distributions;
  const cats = [
    ["agree_strongly", "Agree strongly", "#2DA583"],
    ["agree_slightly", "Agree slightly", "#43DCC1"],
    ["neither_nor", "Neither / nor", "#51625D"],
    ["disagree_slightly", "Disagree slightly", "#C99B57"],
    ["disagree_strongly", "Disagree strongly", "#E8A94F"],
    ["dont_know", "Don't know", "#3A4A52"],
  ] as const;
  const rows = Object.entries(dist).sort(
    (a, b) => (a[1].agree_strongly ?? 0) - (b[1].agree_strongly ?? 0),
  );
  const short = (s: string) =>
    s.length > 46 ? `${s.slice(0, 44).replace(/,\s*$/, "")}…` : s;
  return {
    ...base,
    legend: {
      top: 0,
      textStyle: { color: ink.secondary, fontFamily: font, fontSize: 10.5 },
      itemWidth: 11,
      itemHeight: 8,
    },
    grid: { left: 4, right: 14, top: 30, bottom: 6, containLabel: true },
    xAxis: {
      type: "value",
      max: 1,
      ...axisCommon,
      axisLabel: { ...axisCommon.axisLabel, formatter: (v: number) => `${Math.round(v * 100)}%` },
    },
    yAxis: {
      type: "category",
      data: rows.map(([k]) => short(`…${k}`)),
      ...axisCommon,
      splitLine: { show: false },
      axisLabel: { ...axisCommon.axisLabel, fontSize: 10.5, width: 215, overflow: "break", color: ink.secondary },
    },
    series: cats.map(([key, label, color]) => ({
      name: label,
      type: "bar",
      stack: "s",
      barWidth: 13,
      itemStyle: { color, borderColor: "rgba(8,29,40,0.85)", borderWidth: 1 },
      emphasis: { focus: "series" },
      data: rows.map(([, v]) => +((v[key] ?? 0) as number).toFixed(4)),
    })),
    tooltip: {
      ...base.tooltip,
      formatter: (p: { seriesName: string; value: number; name: string }) =>
        `My local greenspaces ${p.name.replace("…", "")}<br/>${p.seriesName}: <b>${(p.value * 100).toFixed(1)}%</b>`,
    },
  };
}

/** Q15 walk-time distribution. */
export function q15Option(): EChartsCoreOption {
  const d = (surveyInputs as {
    q15: { response_distribution_2025: Record<string, number> };
  }).q15.response_distribution_2025;
  const entries = Object.entries(d);
  return {
    ...base,
    grid: { left: 6, right: 10, top: 14, bottom: 4, containLabel: true },
    xAxis: {
      type: "category",
      data: entries.map(([k]) => k.replace("Within a ", "").replace(" walk", "")),
      ...axisCommon,
      axisLabel: { ...axisCommon.axisLabel, interval: 0, width: 72, overflow: "break" },
      splitLine: { show: false },
    },
    yAxis: {
      type: "value",
      max: 0.25,
      ...axisCommon,
      axisLabel: { ...axisCommon.axisLabel, formatter: (v: number) => `${Math.round(v * 100)}%` },
    },
    series: [
      {
        type: "bar",
        barWidth: 26,
        data: entries.map(([, v]) => v),
        itemStyle: { color: themeSeries.access_to, borderRadius: [4, 4, 0, 0] },
        label: {
          show: true,
          position: "top",
          color: ink.secondary,
          fontFamily: font,
          fontSize: 10.5,
          formatter: ({ value }: { value: number }) => `${Math.round((value as number) * 100)}%`,
        },
      },
    ],
    tooltip: { ...base.tooltip, formatter: (p: { name: string; value: number }) => `${p.name}: <b>${Math.round(p.value * 100)}%</b>` },
  };
}

/** Visit-frequency gradient (validity evidence) — total % by frequency group. */
export function visitFrequencyOption(): EChartsCoreOption {
  const groups = (
    classificationsVisit() as { group: string; total_pct: number }[]
  ).map((g) => ({ name: g.group.replace("More than twice a week, but not every day", "3–6 times a week"), value: +(g.total_pct * 100).toFixed(1) }));
  return {
    ...base,
    grid: { left: 6, right: 20, top: 14, bottom: 4, containLabel: true },
    xAxis: {
      type: "value",
      min: 50,
      max: 90,
      ...axisCommon,
      axisLabel: { ...axisCommon.axisLabel, formatter: (v: number) => `${v}%` },
    },
    yAxis: {
      type: "category",
      data: groups.map((g) => g.name).reverse(),
      ...axisCommon,
      splitLine: { show: false },
      axisLabel: { ...axisCommon.axisLabel, fontSize: 10.5, color: ink.secondary },
    },
    series: [
      {
        type: "bar",
        barWidth: 12,
        data: groups
          .map((g) => ({ value: g.value, itemStyle: { color: palette.turquoise, borderRadius: [0, 4, 4, 0] } }))
          .reverse(),
        label: {
          show: true,
          position: "right",
          color: ink.secondary,
          fontFamily: font,
          fontSize: 10.5,
          formatter: "{c}%",
        },
      },
    ],
    tooltip: { ...base.tooltip, formatter: (p: { name: string; value: number }) => `Visit greenspace ${p.name.toLowerCase()}<br/>Overall score: <b>${p.value}%</b> of maximum` },
  };
}

/** Demographic group comparison (index format) for Understand. */
export function groupIndexOption(
  groups: { group: string; total_index: number }[],
  color: string,
): EChartsCoreOption {
  return {
    ...base,
    grid: { left: 6, right: 26, top: 22, bottom: 4, containLabel: true },
    xAxis: { type: "value", min: 90, max: 110, ...axisCommon },
    yAxis: {
      type: "category",
      data: groups.map((g) => g.group).reverse(),
      ...axisCommon,
      splitLine: { show: false },
      axisLabel: { ...axisCommon.axisLabel, fontSize: 10.5, color: ink.secondary },
    },
    series: [
      {
        type: "bar",
        barWidth: 11,
        data: groups
          .map((g) => ({ value: +g.total_index.toFixed(1), itemStyle: { color, borderRadius: [0, 4, 4, 0] } }))
          .reverse(),
        label: { show: true, position: "right", color: ink.secondary, fontFamily: font, fontSize: 10.5 },
        markLine: {
          symbol: "none",
          lineStyle: { color: ink.muted, type: "dashed", width: 1 },
          label: { formatter: "NI 100", color: ink.muted, fontSize: 9.5, fontFamily: font },
          data: [{ xAxis: 100 }],
        },
      },
    ],
  };
}

function classificationsVisit() {
  return (classifications as { visit_frequency: { groups: unknown[] } }).visit_frequency.groups;
}

export function classificationGroups(kind: "deprivation" | "urban_rural" | "age" | "sex") {
  return (classifications as Record<string, { groups: { group: string; total_index: number; total_pct: number }[] }>)[kind].groups;
}

export const themeColor = (t: ThemeId | "total") => themeSeries[t];
