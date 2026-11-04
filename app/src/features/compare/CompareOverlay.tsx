import { useMemo } from "react";
import {
  THEME_ORDER,
  THEME_SHORT,
  LGD_DISPLAY,
  fmtIndex,
  fmtPct1,
  integrity,
  lgdByCode,
  type MetricId,
} from "../../data";
import { themeSeries } from "../../config/branding";
import { useAppDispatch, useAppState } from "../../state/AppState";
import { Chart } from "../../charts/Chart";
import { areaRadarOption, councilRankOption } from "../../charts/options";
import { FormatToggle } from "../../components/shared";
import { PostcodeCompare, ThemeLeaders } from "./PostcodeCompare";
import { useState } from "react";

type Geo = "councils" | "areas" | "sectors";

export function CompareOverlay() {
  const { metric, format, selectedCode } = useAppState();
  const dispatch = useAppDispatch();
  const [geo, setGeo] = useState<Geo>("councils");

  const rankOption = useMemo(
    () => councilRankOption(metric, format, selectedCode),
    [metric, format, selectedCode],
  );
  const radarOption = useMemo(
    () => (selectedCode ? areaRadarOption(selectedCode) : null),
    [selectedCode],
  );

  const onBarClick = useMemo(
    () => ({
      click: (p: unknown) => {
        const { data } = p as { data?: { code?: string } };
        if (data?.code) dispatch({ type: "select", code: data.code });
      },
    }),
    [dispatch],
  );

  const selected = selectedCode ? lgdByCode[selectedCode] : null;

  return (
    <div className="overlay-stage" role="region" aria-label="Council comparison">
      <div className="overlay-inner">
        <p className="section-label">Compare</p>
        <h1 className="overlay-hero">
          {geo === "councils"
            ? "Modest differences between councils — with accessibility varying most"
            : "Postcode geographies vary far more than councils"}
        </h1>
        <p className="overlay-lede">
          {geo === "councils" ? (
            <>
              Every council scores between 73% and 80% of the maximum. {integrity.significance};{" "}
              {integrity.lgdSamples.toLowerCase()}.
            </>
          ) : (
            <>
              Published totals span roughly 71–87% of the maximum across postcode geographies —
              where the index starts to identify local strengths and priority areas. Survey
              perceptions, {integrity.threshold.toLowerCase()}.
            </>
          )}
        </p>

        <div className="format-toggle" style={{ width: 380, marginBottom: 14 }} role="group" aria-label="Comparison geography">
          {([
            ["councils", "Councils (11)"],
            ["areas", "Postcode areas (48)"],
            ["sectors", "Sectors (23)"],
          ] as const).map(([id, label]) => (
            <button key={id} aria-pressed={geo === id} onClick={() => setGeo(id)}>
              {label}
            </button>
          ))}
        </div>

        {geo === "areas" && (
          <>
            <PostcodeCompare kind="areas" />
            <ThemeLeaders />
          </>
        )}
        {geo === "sectors" && <PostcodeCompare kind="sectors" />}

        {geo === "councils" && (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.5fr) minmax(0,1fr)", gap: 14, alignItems: "start" }}>
          <section className="prose-block glass">
            <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
              <h3 style={{ marginRight: "auto" }}>Ranked councils</h3>
              <div className="segmented row" role="group" aria-label="Metric">
                {(["total", ...THEME_ORDER] as MetricId[]).map((m) => (
                  <button key={m} aria-pressed={metric === m} onClick={() => dispatch({ type: "metric", metric: m })}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span className="dot" style={{ background: themeSeries[m] }} />
                      {THEME_SHORT[m]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            {metric === "total" && (
              <div style={{ maxWidth: 260, marginTop: 10 }}>
                <FormatToggle />
              </div>
            )}
            <Chart
              option={rankOption}
              className="chart-box tall"
              onEvents={onBarClick}
              ariaLabel="Ranked bar chart of all eleven councils; click a bar to select that council"
            />
            <p className="legend-note">
              Click a bar to select the council — the map and panels stay in sync. Dashed
              line marks the Northern Ireland average.
            </p>
          </section>

          <section className="prose-block glass">
            <h3>{selected ? LGD_DISPLAY[selected.lad_code] : "Theme profile"}</h3>
            {selected ? (
              <>
                <p style={{ margin: "2px 0 0" }}>
                  Overall <b>{fmtPct1(selected.total_pct)}</b> of maximum · index{" "}
                  <b>{fmtIndex(selected.total_index)}</b> (NI = 100)
                </p>
                {radarOption && (
                  <Chart
                    option={radarOption}
                    className="chart-box"
                    ariaLabel={`Radar chart of theme indices for ${LGD_DISPLAY[selected.lad_code]} against the NI average`}
                  />
                )}
                <table>
                  <thead>
                    <tr><th>Theme</th><th style={{ textAlign: "right" }}>Index</th></tr>
                  </thead>
                  <tbody>
                    {THEME_ORDER.map((t) => (
                      <tr key={t}>
                        <td>{THEME_SHORT[t]}</td>
                        <td className="num" style={{ textAlign: "right" }}>{selected.themes_index[t]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : (
              <p>Select a council from the chart (or the map in Explore) to see its four-theme profile against the NI average.</p>
            )}
            <button
              className="kpi-card"
              style={{ width: "100%", marginTop: 14, textAlign: "center", minWidth: 0 }}
              onClick={() => dispatch({ type: "mode", mode: "explore" })}
            >
              <span style={{ font: "700 12px var(--gani-font-ui)", color: "var(--gani-turquoise)" }}>
                View on the map →
              </span>
            </button>
          </section>
        </div>
        )}
      </div>
    </div>
  );
}
