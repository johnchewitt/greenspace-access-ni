import { useMemo } from "react";
import {
  THEME_ORDER,
  THEME_LABELS,
  THEME_SHORT,
  LGD_DISPLAY,
  fmtIndex,
  fmtIndexInt,
  fmtPct,
  fmtPct1,
  lgdByCode,
  ni,
  postcodeAreas,
  postcodeSectors,
  type MetricId,
} from "../../data";
import { themeSeries } from "../../config/branding";
import { useAppDispatch, useAppState, type Geography, type LayerId } from "../../state/AppState";
import { FormatToggle, MapLegend, SampleSizeBadge, Switch, UncertaintyNote } from "../../components/shared";
import { Chart } from "../../charts/Chart";
import { areaThemesOption } from "../../charts/options";
import { outscapeLayers } from "../../config/services";

const LAYERS: { id: LayerId; label: string }[] = [
  { id: "greenspace", label: "Greenspace sites" },
  { id: "trails", label: "Off-road trails" },
  { id: "accessPoints", label: "Access points" },
  { id: "bluespace", label: "Bluespace (early-stage)" },
  { id: "settlements", label: "Settlement limits (named)" },
];

const GEOGRAPHIES: { id: Geography; label: string; hint: string }[] = [
  { id: "councils", label: "Councils", hint: "11 council areas (boundaries)" },
  { id: "districts", label: "Districts", hint: "BT postcode districts (supplied boundaries)" },
  { id: "sectors", label: "Sectors", hint: "BT postcode sectors (derived within districts)" },
];

export function LeftPanel() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const { metric, format, leftOpen, layers, basemap, serviceStatus, geography } = state;

  return (
    <>
      {!leftOpen && (
        <button
          className="panel-collapse left"
          aria-label="Open controls panel"
          onClick={() => dispatch({ type: "panel", side: "left", open: true })}
        >
          ›
        </button>
      )}
      <div className={`panel-left ${leftOpen ? "" : "collapsed"}`}>
        <section className="panel-section glass">
          <h2 className="section-label">Geography</h2>
          <div className="format-toggle" role="group" aria-label="Map geography">
            {GEOGRAPHIES.map((g) => (
              <button
                key={g.id}
                aria-pressed={geography === g.id}
                onClick={() => dispatch({ type: "geography", geography: g.id })}
                title={g.hint}
              >
                {g.label}
              </button>
            ))}
          </div>
          <p className="format-hint">
            {geography === "councils"
              ? "11 councils as boundaries."
              : geography === "districts"
                ? "81 postcode districts (48 with published results) — supplied boundary dataset."
                : "Postcode sectors (23 with published results) — boundaries derived within the supplied districts from licence-cleared unit-postcode locations; indicative."}
          </p>
        </section>
        <section className="panel-section glass">
          <h2 className="section-label">
            Theme
            <button
              style={{ float: "right", background: "none", border: 0, color: "var(--gani-ink-3)", cursor: "pointer", fontSize: 13, lineHeight: 1 }}
              aria-label="Collapse controls panel"
              onClick={() => dispatch({ type: "panel", side: "left", open: false })}
            >
              ‹
            </button>
          </h2>
          <div className="segmented" role="group" aria-label="Index theme">
            {(["total", ...THEME_ORDER] as MetricId[]).map((m) => (
              <button
                key={m}
                aria-pressed={metric === m}
                onClick={() => dispatch({ type: "metric", metric: m })}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="dot" style={{ background: themeSeries[m] }} />
                  {THEME_SHORT[m]}
                </span>
                <span className="val">
                  {m === "total" ? fmtPct(ni.totalPct) : fmtPct(ni.themesPct[m])}
                </span>
              </button>
            ))}
          </div>
          <p className="format-hint">National scores shown as % of maximum.</p>
        </section>

        <section className="panel-section glass">
          <h2 className="section-label">Score format</h2>
          <FormatToggle />
        </section>

        <section className="panel-section glass">
          <h2 className="section-label">Greenspace NI Map layers</h2>
          {LAYERS.map((l) => {
            const status = serviceStatus[l.id];
            return (
              <div className="layer-row" key={l.id}>
                <Switch
                  checked={layers[l.id]}
                  onChange={(on) => dispatch({ type: "layer", layer: l.id, on })}
                  label={l.label}
                />
                <span>{l.label}</span>
                <span className={`status ${status === "error" ? "err" : ""}`}>
                  {status === "loading" ? "loading…" : status === "error" ? "offline" : ""}
                </span>
              </div>
            );
          })}
          <p className="legend-note">
            Live from Outscape's Greenspace NI Map services ({outscapeLayers.bluespace.note});
            settlement development limits are from the published statutory Area Plans
            (NI Planning open data), labelled by name as you zoom in.
          </p>
        </section>

        <section className="panel-section glass">
          <h2 className="section-label">
            Backdrop
            {serviceStatus.basemap === "error" && (
              <span style={{ float: "right", font: "600 10px var(--gani-font-ui)", color: "var(--gani-gold)" }}>offline</span>
            )}
          </h2>
          <div className="format-toggle" role="group" aria-label="Map backdrop">
            {([
              ["none", "None", "Index canvas only"],
              ["dark", "Dark", "Muted OpenStreetMap backdrop"],
              ["greyscale", "Grey", "Light greyscale OpenStreetMap backdrop"],
              ["streets", "OSM", "OpenStreetMap backdrop"],
            ] as const).map(([id, label, hint]) => (
              <button
                key={id}
                aria-pressed={basemap === id}
                onClick={() => dispatch({ type: "basemap", style: id })}
                title={hint}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="format-hint">
            {basemap === "none"
              ? "Pure index canvas — no base mapping."
              : "OpenStreetMap vector backdrop; index colours sit over it at 85% opacity."}
          </p>
        </section>

        <MapLegend metric={metric} format={format} showUnpublished={geography !== "councils"} />
      </div>
    </>
  );
}

export function KpiStrip() {
  const { metric } = useAppState();
  const dispatch = useAppDispatch();
  const cards: { id: MetricId; value: number }[] = [
    { id: "total", value: ni.totalPct },
    ...THEME_ORDER.map((t) => ({ id: t as MetricId, value: ni.themesPct[t] })),
  ];
  return (
    <div className="kpi-strip glass" role="group" aria-label="Northern Ireland national scores (% of maximum possible)">
      {cards.map((c) => (
        <button
          key={c.id}
          className="kpi-card"
          style={{ "--kpi-color": themeSeries[c.id] } as React.CSSProperties}
          aria-pressed={metric === c.id}
          onClick={() => dispatch({ type: "metric", metric: c.id })}
          title={`${THEME_LABELS[c.id]} — show on map`}
        >
          <div className="kpi-value">{fmtPct(c.value)}</div>
          <div className="kpi-label">{THEME_SHORT[c.id]}</div>
          <div className="kpi-sub">of maximum score · NI</div>
        </button>
      ))}
    </div>
  );
}

function PostcodePanel({ code }: { code: string }) {
  const { rightOpen } = useAppState();
  const dispatch = useAppDispatch();
  const district = postcodeAreas.find((r) => r.postcode_area === code);
  const sector = district ? undefined : postcodeSectors.find((r) => r.postcode_sector === code);
  const rec = district ?? sector;
  if (!rec) {
    return (
      <div className={`panel-right ${rightOpen ? "" : "collapsed"}`}>
        <section className="panel-section glass" aria-label={`${code} — not published`}>
          <h2 className="section-label">{code.includes(" ") ? "Postcode sector" : "Postcode district"}</h2>
          <h3 className="area-name">{code}</h3>
          <p className="format-hint" style={{ marginTop: 8 }}>
            No published result for this area: the interim report publishes postcode
            results only where the sample reaches n ≥ 30. Its boundary is shown so the
            geography stays complete.
          </p>
          <button
            className="kpi-card"
            style={{ width: "100%", marginTop: 8, textAlign: "center", minWidth: 0 }}
            onClick={() => dispatch({ type: "selectPostcode", code: null })}
          >
            <span style={{ font: "700 12px var(--gani-font-ui)", color: "var(--gani-ink-2)" }}>Clear selection</span>
          </button>
        </section>
      </div>
    );
  }
  const kindLabel = district ? "Postcode district" : "Postcode sector";
  return (
    <div className={`panel-right ${rightOpen ? "" : "collapsed"}`}>
      <section className="panel-section glass" aria-label={`${code} profile`}>
        <h2 className="section-label">{kindLabel}</h2>
        <h3 className="area-name">
          {code} <span style={{ color: "var(--gani-ink-3)", fontWeight: 500 }}>· {rec.place}</span>
        </h3>
        <SampleSizeBadge n={rec.sample_n} />
        <div className="big-pair" style={{ marginTop: 8 }}>
          <div>
            <div className="n" style={{ color: "var(--gani-turquoise)" }}>{fmtPct1(rec.total_pct)}</div>
            <div className="cap">overall · % of maximum</div>
          </div>
          <div>
            <div className="n" style={{ color: "var(--gani-gold)" }}>{fmtIndex(rec.total_index)}</div>
            <div className="cap">index · NI average = 100</div>
          </div>
        </div>
        <table className="rank-table" style={{ marginTop: 10 }}>
          <tbody>
            {THEME_ORDER.map((t) => (
              <tr key={t}>
                <td>
                  <i className="dot" style={{ background: themeSeries[t], width: 8, height: 8, borderRadius: "50%", display: "inline-block", marginRight: 7 }} />
                  {THEME_SHORT[t]}
                </td>
                <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 700 }}>
                  {fmtIndexInt(rec.themes_index[t])}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <UncertaintyNote />
        <p className="format-hint" style={{ marginTop: 8 }}>
          {code.includes(" ")
            ? "Sector boundary derived within the supplied district boundaries from licence-cleared unit-postcode locations — indicative."
            : "District boundary from the supplied boundary dataset."}{" "}
          Scores shown in bands; small differences between areas are not meaningful at
          these sample sizes.
        </p>
        <button
          className="kpi-card"
          style={{ width: "100%", marginTop: 8, textAlign: "center", minWidth: 0 }}
          onClick={() => dispatch({ type: "selectPostcode", code: null })}
        >
          <span style={{ font: "700 12px var(--gani-font-ui)", color: "var(--gani-ink-2)" }}>Clear selection</span>
        </button>
      </section>
    </div>
  );
}

export function AreaPanel() {
  const { selectedCode, selectedPostcode, rightOpen } = useAppState();
  const dispatch = useAppDispatch();
  const record = selectedCode ? lgdByCode[selectedCode] : null;
  const option = useMemo(
    () => (selectedCode ? areaThemesOption(selectedCode) : null),
    [selectedCode],
  );

  if (selectedPostcode) return <PostcodePanel code={selectedPostcode} />;

  if (!record || !selectedCode) {
    return (
      <div className={`panel-right ${rightOpen ? "" : "collapsed"}`}>
        <section className="panel-section glass" aria-label="Northern Ireland overview">
          <h2 className="section-label">Northern Ireland</h2>
          <p className="area-kicker" style={{ marginBottom: 8 }}>
            Select a council on the map — or try Belfast — to see its profile.
          </p>
          <div className="big-pair">
            <div>
              <div className="n" style={{ color: "var(--gani-turquoise)" }}>{fmtPct(ni.totalPct)}</div>
              <div className="cap">overall score · % of maximum</div>
            </div>
          </div>
          <p className="format-hint" style={{ marginTop: 10 }}>
            People value their local greenspaces: perceived quality (80%), benefits (83%)
            and access within sites (81%) all score strongly. Perceived accessibility
            <i> to</i> greenspace is less positive (65%) — the pattern this index was
            designed to surface.
          </p>
          <p className="legend-note">
            An interpretation of survey findings — not a claim about objectively measured
            physical access.
          </p>
        </section>
      </div>
    );
  }

  const delta = record.total_index - 100;
  return (
    <>
      {!rightOpen && (
        <button
          className="panel-collapse right"
          aria-label="Open area panel"
          onClick={() => dispatch({ type: "panel", side: "right", open: true })}
        >
          ‹
        </button>
      )}
      <div className={`panel-right ${rightOpen ? "" : "collapsed"}`}>
        <section className="panel-section glass panel-scroll" aria-label={`${LGD_DISPLAY[selectedCode]} profile`}>
          <h2 className="section-label">
            Council profile
            <button
              style={{ float: "right", background: "none", border: 0, color: "var(--gani-ink-3)", cursor: "pointer", fontSize: 13, lineHeight: 1 }}
              aria-label="Collapse area panel"
              onClick={() => dispatch({ type: "panel", side: "right", open: false })}
            >
              ›
            </button>
          </h2>
          <h3 className="area-title">{LGD_DISPLAY[selectedCode]}</h3>
          <p className="area-kicker">
            {record.report_name} in the source report · <SampleSizeBadge n={null} />
          </p>
          <div className="big-pair">
            <div>
              <div className="n" style={{ color: "var(--gani-turquoise)" }}>{fmtPct1(record.total_pct)}</div>
              <div className="cap">overall · % of maximum</div>
            </div>
            <div>
              <div className="n" style={{ color: "var(--gani-gold)" }}>{fmtIndex(record.total_index)}</div>
              <div className="cap">index · NI average = 100</div>
            </div>
          </div>
          <span className={`delta-chip ${delta < 0 ? "below" : ""}`}>
            {delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(1)} vs NI average
          </span>

          <h2 className="section-label" style={{ marginTop: 18 }}>Theme indices</h2>
          {option && (
            <Chart
              option={option}
              className="chart-box"
              ariaLabel={`Theme indices for ${LGD_DISPLAY[selectedCode]} against the Northern Ireland average of 100`}
            />
          )}
          <UncertaintyNote />
          <button
            className="kpi-card"
            style={{ width: "100%", marginTop: 12, textAlign: "center", minWidth: 0 }}
            onClick={() => dispatch({ type: "mode", mode: "pvp" })}
          >
            <span style={{ font: "700 12px var(--gani-font-ui)", color: "var(--gani-gold)" }}>
              Compare with what the map shows →
            </span>
          </button>
          <button
            className="kpi-card"
            style={{ width: "100%", marginTop: 8, textAlign: "center", minWidth: 0 }}
            onClick={() => dispatch({ type: "report", open: true })}
            title={`Generate a branded evidence summary for ${LGD_DISPLAY[selectedCode]}`}
          >
            <span style={{ font: "700 12px var(--gani-font-ui)", color: "var(--gani-turquoise)" }}>
              Create report (PDF)
            </span>
          </button>
        </section>
      </div>
    </>
  );
}

