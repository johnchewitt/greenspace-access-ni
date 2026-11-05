import { useMemo, useState } from "react";
import type { EChartsCoreOption } from "echarts/core";
import { Chart } from "../../charts/Chart";
import { ink, palette } from "../../config/branding";
import {
  THEME_ORDER,
  THEME_SHORT,
  LGD_DISPLAY,
  fmtIndex,
  fmtPct1,
  lgd,
  lgdByCode,
} from "../../data";
import { useAppDispatch } from "../../state/AppState";
import { fmtProvision, type ProvisionRecord } from "../pvp/provision";
import type { ProvisionState } from "../pvp/PvpMode";

const font = "Manrope, sans-serif";
const A_COLOR = palette.turquoise;
const B_COLOR = palette.gold;

function pairedThemesOption(aCode: string, bCode: string): EChartsCoreOption {
  const a = lgdByCode[aCode];
  const b = lgdByCode[bCode];
  return {
    textStyle: { fontFamily: font, color: ink.secondary },
    legend: {
      top: 0,
      textStyle: { color: ink.secondary, fontFamily: font, fontSize: 11 },
      itemWidth: 11,
      itemHeight: 8,
    },
    grid: { left: 6, right: 28, top: 30, bottom: 6, containLabel: true },
    xAxis: {
      type: "value",
      min: 80,
      max: 115,
      axisLabel: { color: ink.muted, fontFamily: font, fontSize: 10.5 },
      splitLine: { lineStyle: { color: "rgba(242,244,233,0.07)" } },
    },
    yAxis: {
      type: "category",
      data: [...THEME_ORDER].reverse().map((t) => THEME_SHORT[t]),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: ink.secondary, fontFamily: font, fontSize: 11 },
    },
    series: [
      {
        name: LGD_DISPLAY[aCode],
        type: "bar",
        barWidth: 9,
        itemStyle: { color: A_COLOR, borderRadius: [0, 3, 3, 0] },
        data: [...THEME_ORDER].reverse().map((t) => a.themes_index[t]),
        label: { show: true, position: "right", color: ink.secondary, fontSize: 10, fontFamily: font },
      },
      {
        name: LGD_DISPLAY[bCode],
        type: "bar",
        barWidth: 9,
        itemStyle: { color: B_COLOR, borderRadius: [0, 3, 3, 0] },
        data: [...THEME_ORDER].reverse().map((t) => b.themes_index[t]),
        label: { show: true, position: "right", color: ink.secondary, fontSize: 10, fontFamily: font },
      },
    ],
    tooltip: {
      backgroundColor: "rgba(8,29,40,0.94)",
      borderColor: "rgba(67,220,193,0.25)",
      textStyle: { color: ink.primary, fontFamily: font, fontSize: 12 },
      formatter: (p: { seriesName: string; name: string; value: number }) =>
        `${p.seriesName}<br/>${p.name}: index <b>${p.value}</b> (NI = 100)`,
    },
  };
}

function Cell({ label, a, b }: { label: string; a: string; b: string }) {
  return (
    <tr>
      <td>{label}</td>
      <td className="num" style={{ textAlign: "right", color: A_COLOR, fontWeight: 700 }}>{a}</td>
      <td className="num" style={{ textAlign: "right", color: B_COLOR, fontWeight: 700 }}>{b}</td>
    </tr>
  );
}

export function TwoCouncils({ provision }: { provision: ProvisionState }) {
  const dispatch = useAppDispatch();
  const [aCode, setA] = useState("N09000003"); // Belfast
  const [bCode, setB] = useState("N09000006"); // Fermanagh & Omagh — widest published contrast
  const a = lgdByCode[aCode];
  const b = lgdByCode[bCode];
  const prov: Record<string, ProvisionRecord> | null =
    provision.status === "ok" ? provision.byCode : null;

  const option = useMemo(() => pairedThemesOption(aCode, bCode), [aCode, bCode]);

  const selStyle: React.CSSProperties = {
    background: "rgba(8,29,40,0.8)",
    color: "var(--gani-cream)",
    border: "1px solid rgba(67,220,193,0.25)",
    borderRadius: 8,
    font: "600 12px var(--gani-font-ui)",
    padding: "6px 8px",
  };

  return (
    <section className="prose-block glass">
      <h3>Compare two councils</h3>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 6 }}>
        <span className="dot" style={{ width: 9, height: 9, borderRadius: "50%", background: A_COLOR }} />
        <select style={selStyle} value={aCode} onChange={(e) => setA(e.target.value)} aria-label="First council">
          {lgd.map((r) => (
            <option key={r.lad_code} value={r.lad_code}>{LGD_DISPLAY[r.lad_code]}</option>
          ))}
        </select>
        <span style={{ color: "var(--gani-ink-3)", font: "700 11px var(--gani-font-ui)" }}>vs</span>
        <span className="dot" style={{ width: 9, height: 9, borderRadius: "50%", background: B_COLOR }} />
        <select style={selStyle} value={bCode} onChange={(e) => setB(e.target.value)} aria-label="Second council">
          {lgd.map((r) => (
            <option key={r.lad_code} value={r.lad_code}>{LGD_DISPLAY[r.lad_code]}</option>
          ))}
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.1fr) minmax(0,1fr)", gap: 18, marginTop: 12, alignItems: "start" }}>
        <Chart option={option} className="chart-box" style={{ height: 230 }} ariaLabel={`Theme indices for ${LGD_DISPLAY[aCode]} and ${LGD_DISPLAY[bCode]} against the NI average`} />
        <table>
          <thead>
            <tr>
              <th>Indicator</th>
              <th style={{ textAlign: "right" }}>{LGD_DISPLAY[aCode]}</th>
              <th style={{ textAlign: "right" }}>{LGD_DISPLAY[bCode]}</th>
            </tr>
          </thead>
          <tbody>
            <Cell label="Overall · % of maximum" a={fmtPct1(a.total_pct)} b={fmtPct1(b.total_pct)} />
            <Cell label="Overall index (NI = 100)" a={fmtIndex(a.total_index)} b={fmtIndex(b.total_index)} />
            <Cell
              label="Households within 400 m (provision)"
              a={prov ? fmtProvision(prov[aCode]?.pct400 ?? null) : "—"}
              b={prov ? fmtProvision(prov[bCode]?.pct400 ?? null) : "—"}
            />
            <Cell
              label="Within 1 km"
              a={prov ? fmtProvision(prov[aCode]?.pct1km ?? null) : "—"}
              b={prov ? fmtProvision(prov[bCode]?.pct1km ?? null) : "—"}
            />
          </tbody>
        </table>
      </div>
      <p className="legend-note">
        Perception rows are survey-based (POMNI 2025, published);{" "}
        {provision.status === "ok"
          ? `provision rows are the published GreenspaceNI council analysis${provision.year ? ` (${provision.year} vintage)` : ""}.`
          : "provision rows will appear when the GreenspaceNI council analysis service is reachable."}{" "}
        Differences are descriptive, not assessments.
      </p>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        {[aCode, bCode].map((c, i) => (
          <button
            key={c}
            className="kpi-card"
            style={{ flex: 1, textAlign: "center", minWidth: 0, "--kpi-color": i === 0 ? A_COLOR : B_COLOR } as React.CSSProperties}
            onClick={() => {
              dispatch({ type: "select", code: c });
              dispatch({ type: "mode", mode: "explore" });
            }}
          >
            <span style={{ font: "700 11.5px var(--gani-font-ui)", color: i === 0 ? A_COLOR : B_COLOR }}>
              {LGD_DISPLAY[c]} on the map →
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
