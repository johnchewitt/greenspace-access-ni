import { useMemo } from "react";
import type { EChartsCoreOption } from "echarts/core";
import { Chart } from "../../charts/Chart";
import { ink, palette, themeSeries } from "../../config/branding";
import { LGD_DISPLAY, fmtPct, integrity, lgd, ni } from "../../data";
import { useAppDispatch, useAppState } from "../../state/AppState";
import { fmtProvision, type NIProvision, type ProvisionRecord } from "../pvp/provision";
import type { ProvisionState } from "../pvp/PvpMode";
import { fmtHa, fmtInt, useInsightStats } from "./useInsightStats";

const font = "Manrope, sans-serif";

/** Councils: % households within 400 m (published), click → map. */
function provisionByCouncilOption(
  byCode: Record<string, ProvisionRecord>,
  niRef: number | null,
): EChartsCoreOption {
  const rows = lgd
    .map((r) => ({
      code: r.lad_code,
      name: LGD_DISPLAY[r.lad_code],
      v: byCode[r.lad_code]?.pct400 ?? null,
    }))
    .filter((r): r is { code: string; name: string; v: number } => r.v != null)
    .sort((a, b) => a.v - b.v);
  return {
    textStyle: { fontFamily: font, color: ink.secondary },
    grid: { left: 8, right: 40, top: 22, bottom: 8, containLabel: true },
    xAxis: {
      type: "value",
      min: 0,
      max: 100,
      axisLabel: { color: ink.muted, fontFamily: font, fontSize: 10.5, formatter: "{value}%" },
      splitLine: { lineStyle: { color: "rgba(242,244,233,0.07)" } },
    },
    yAxis: {
      type: "category",
      data: rows.map((r) => r.name),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: ink.secondary, fontFamily: font, fontSize: 11 },
    },
    series: [
      {
        type: "bar",
        barWidth: 12,
        data: rows.map((r) => ({
          value: +r.v.toFixed(1),
          code: r.code,
          itemStyle: { color: palette.lime, borderRadius: [0, 4, 4, 0] },
        })),
        label: {
          show: true,
          position: "right",
          color: ink.secondary,
          fontFamily: font,
          fontSize: 10.5,
          formatter: "{c}%",
        },
        markLine:
          niRef == null
            ? undefined
            : {
                symbol: "none",
                lineStyle: { color: ink.muted, type: "dashed", width: 1 },
                label: { formatter: `NI ${niRef.toFixed(1)}%`, color: ink.muted, fontSize: 10, fontFamily: font, position: "end", distance: 4 },
                data: [{ xAxis: niRef }],
              },
      },
    ],
    tooltip: {
      backgroundColor: "rgba(8,29,40,0.94)",
      borderColor: "rgba(67,220,193,0.25)",
      textStyle: { color: ink.primary, fontFamily: font, fontSize: 12 },
      formatter: (p: { name: string; value: number }) =>
        `${p.name}<br/>Households within 400 m: <b>${p.value}%</b>`,
    },
  };
}

function Kpi({ value, label, sub, color }: { value: string; label: string; sub: string; color?: string }) {
  return (
    <div className="kpi-card" style={{ cursor: "default", minWidth: 150, "--kpi-color": color ?? palette.turquoise } as React.CSSProperties}>
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">{label}</div>
      <div className="kpi-sub">{sub}</div>
    </div>
  );
}

export function InsightsOverlay({
  provision,
  niProvision,
}: {
  provision: ProvisionState;
  niProvision: NIProvision | null;
}) {
  const { mode } = useAppState();
  const dispatch = useAppDispatch();
  const stats = useInsightStats(mode === "insights");

  const provOption = useMemo(
    () =>
      provision.status === "ok"
        ? provisionByCouncilOption(provision.byCode, niProvision?.pct400 ?? null)
        : null,
    [provision, niProvision],
  );

  const onBarClick = useMemo(
    () => ({
      click: (p: unknown) => {
        const { data } = p as { data?: { code?: string } };
        if (data?.code) {
          dispatch({ type: "select", code: data.code });
          dispatch({ type: "mode", mode: "explore" });
        }
      },
    }),
    [dispatch],
  );

  return (
    <div className="overlay-stage" role="region" aria-label="Greenspace insights dashboard">
      <div className="overlay-inner">
        <p className="section-label">Insights · provision &amp; perception at a glance</p>
        <h1 className="overlay-hero">Northern Ireland's greenspace, in numbers</h1>
        <p className="overlay-lede">
          Live headline indicators from the Greenspace NI Map services, alongside the
          proposed survey index. Mapped-provision figures are queried from the services at
          view time; perception figures are the published POMNI 2025 results.
        </p>

        <section className="prose-block glass">
          <h3>Mapped provision — live from the Greenspace NI Map</h3>
          {stats?.failed && (
            <p className="legend-note">
              The Greenspace NI Map services are unreachable right now — figures will
              appear when they can be queried.
            </p>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 8 }}>
            <Kpi value={fmtHa(stats?.greenspaceHa ?? null)} label="Mapped greenspace" sub="publicly accessible sites ≥ 0.5 ha" color={palette.lime} />
            <Kpi value={fmtInt(stats?.greenspaceCount ?? null)} label="Greenspace sites" sub="shown on the map" color={palette.lime} />
            <Kpi value={fmtInt(stats?.trailCount ?? null)} label="Off-road trails" sub="mapped routes" color={palette.turquoise} />
            <Kpi value={fmtInt(stats?.accessPointCount ?? null)} label="Access points" sub="sites ≥ 2 ha" color={palette.gold} />
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
            <Kpi value={fmtProvision(niProvision?.pct400 ?? null)} label="Within 400 m" sub="NI households near greenspace/trails" color="#7FAEF5" />
            <Kpi value={fmtProvision(niProvision?.pct1km ?? null)} label="Within 1 km" sub="NI households" color="#7FAEF5" />
            <Kpi value={fmtProvision(niProvision?.pct2km ?? null)} label="Within 2 km" sub="NI households" color="#7FAEF5" />
          </div>
          <p className="legend-note">
            Source: Greenspace NI Map services (ORNI/Outscape), queried live
            {niProvision?.year ? `; household proximity from the ${niProvision.year} analysis vintage` : ""}.
            Household percentages are the published basis — population counts are not
            published at this level. No standards compliance is assessed: the index is a
            proposed methodology, and the 400 m figure relates to the Programme for
            Government "5-minute walk" ambition without constituting a formal assessment.
          </p>
        </section>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(330px, 1fr))", gap: 14, marginTop: 14 }}>
          <section className="prose-block glass" style={{ marginTop: 0 }}>
            <h3>Provision by council</h3>
            <p style={{ margin: "2px 0 0" }}>
              Published % of households within 400 m of greenspace or trails. Click a bar
              to open that council on the map.
            </p>
            {provOption ? (
              <Chart option={provOption} className="chart-box" style={{ height: 320 }} onEvents={onBarClick} ariaLabel="Households within 400 metres of greenspace by council; click a bar to open that council on the map" />
            ) : (
              <p className="legend-note" style={{ marginTop: 10 }}>
                {provision.status === "loading" ? "Loading council indicators…" : "Council indicators unavailable (service offline)."}
              </p>
            )}
          </section>

          <section className="prose-block glass" style={{ marginTop: 0 }}>
            <h3>Perception — the proposed index</h3>
            <p style={{ margin: "2px 0 0" }}>
              POMNI 2025, published national scores (% of maximum possible).
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
              <Kpi value={fmtPct(ni.totalPct)} label="Overall" sub="survey perceptions · n = 4,000" />
              <Kpi value={fmtPct(ni.themesPct.access_to)} label="Access To" sub="lowest theme" color={themeSeries.access_to} />
              <Kpi value={fmtPct(ni.themesPct.benefits)} label="Benefits" sub="highest theme" color={themeSeries.benefits} />
            </div>
            <p className="format-hint" style={{ marginTop: 12 }}>
              The contrast that matters: perceived <i>benefits</i> and <i>quality</i> score
              far above perceived <i>accessibility to</i> greenspace
              {niProvision?.pct400 != null
                ? ` — and the mapped 400 m figure (${fmtProvision(niProvision.pct400)} of households) points the same way.`
                : "."}{" "}
              Two kinds of evidence; explore the relationship council-by-council in
              Perception vs Provision.
            </p>
            <button
              className="kpi-card"
              style={{ width: "100%", marginTop: 8, textAlign: "center", minWidth: 0 }}
              onClick={() => dispatch({ type: "mode", mode: "pvp" })}
            >
              <span style={{ font: "700 12px var(--gani-font-ui)", color: "var(--gani-gold)" }}>
                Open Perception vs Provision →
              </span>
            </button>
          </section>
        </div>

        <p className="legend-note" style={{ marginTop: 14 }}>
          {integrity.basis}. {integrity.significance}.
        </p>
      </div>
    </div>
  );
}
