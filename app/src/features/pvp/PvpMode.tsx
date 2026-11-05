import { useEffect, useMemo, useState } from "react";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import {
  THEME_ORDER,
  THEME_SHORT,
  LGD_DISPLAY,
  fmtIndex,
  fmtPct1,
  lgdByCode,
  ni,
  fmtPct,
} from "../../data";
import {
  fmtProvision,
  pickLatestNI,
  pickLatestProvision,
  type NIProvision,
  type ProvisionAttrs,
  type ProvisionRecord,
} from "./provision";
import { allNIAnalysis, councilProvision2025, outscapeLayers, sdzVintageByField } from "../../config/services";
import { useAppDispatch, useAppState } from "../../state/AppState";
import { SampleSizeBadge, Switch } from "../../components/shared";
import { sdzLabels, sdzRamp } from "../../map/renderers";

export type ProvisionState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ok"; byCode: Record<string, ProvisionRecord>; year: number | null };

/**
 * Query the published council provision indicators once. The service carries
 * one row per council per analysis year — pickLatestProvision pins the most
 * recent vintage (see provision.ts). Values are displayed exactly as published.
 */
export function useProvision(active: boolean): ProvisionState {
  const [state, setState] = useState<ProvisionState>({ status: "loading" });
  useEffect(() => {
    if (!active || state.status === "ok") return;
    let cancelled = false;
    const layer = new FeatureLayer({ url: councilProvision2025.url });
    layer
      .queryFeatures({
        where: "1=1",
        outFields: ["LGDName", "LGDCode", "Year_", "Percent400", "Percent1km", "Percent2km"],
        returnGeometry: false,
      })
      .then((fs) => {
        if (cancelled) return;
        const { byCode, year } = pickLatestProvision(
          fs.features as unknown as { attributes: ProvisionAttrs }[],
        );
        setState(
          Object.keys(byCode).length > 0
            ? { status: "ok", byCode, year }
            : { status: "error" },
        );
      })
      .catch(() => !cancelled && setState({ status: "error" }));
    return () => {
      cancelled = true;
    };
  }, [active, state.status]);
  return state;
}

/** NI-wide published figures (latest vintage) — also the quadrant reference. */
export function useNIProvision(active: boolean): NIProvision | null {
  const [ni, setNi] = useState<NIProvision | null>(null);
  useEffect(() => {
    if (!active || ni) return;
    let cancelled = false;
    const layer = new FeatureLayer({ url: allNIAnalysis.url });
    layer
      .queryFeatures({
        where: "1=1",
        outFields: ["Year_", "Percent400", "Percent1km", "Percent2km"],
        returnGeometry: false,
      })
      .then((fs) => {
        if (cancelled) return;
        setNi(pickLatestNI(fs.features as unknown as { attributes: Record<string, number | string> }[]));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [active, ni]);
  return ni;
}

export function PvpBanner() {
  return (
    <div className="pvp-banner glass-strong" aria-hidden="true">
      <span className="side" style={{ color: "var(--gani-turquoise)" }}>WHAT RESIDENTS EXPERIENCE</span>
      <span className="vs">vs</span>
      <span className="side" style={{ color: "var(--gani-lime)" }}>WHAT THE MAP SHOWS</span>
    </div>
  );
}

export function PerceptionPanel() {
  const { selectedCode } = useAppState();
  const record = selectedCode ? lgdByCode[selectedCode] : null;
  return (
    <section className="pvp-panel left glass panel-section panel-scroll" aria-label="Perception — survey index">
      <p className="tagline" style={{ color: "var(--gani-turquoise)" }}>Perception · POMNI survey</p>
      <h3>{record && selectedCode ? LGD_DISPLAY[selectedCode] : "Northern Ireland"}</h3>
      {record ? (
        <>
          <div className="pvp-metric">
            <span>Overall Greenspace Index</span>
            <span className="v accent">{fmtPct1(record.total_pct)} · idx {fmtIndex(record.total_index)}</span>
          </div>
          {THEME_ORDER.map((t) => (
            <div className="pvp-metric" key={t}>
              <span>{THEME_SHORT[t]}</span>
              <span className="v">{record.themes_index[t]} <span style={{ color: "var(--gani-ink-3)", fontWeight: 500 }}>/ NI 100</span></span>
            </div>
          ))}
          <p className="legend-note">
            Residents' perceptions, POMNI 2025 · <SampleSizeBadge n={null} />
          </p>
        </>
      ) : (
        <>
          <div className="pvp-metric">
            <span>Overall Greenspace Index</span>
            <span className="v accent">{fmtPct(ni.totalPct)} of maximum</span>
          </div>
          {THEME_ORDER.map((t) => (
            <div className="pvp-metric" key={t}>
              <span>{THEME_SHORT[t]}</span>
              <span className="v">{fmtPct(ni.themesPct[t])}</span>
            </div>
          ))}
          <p className="legend-note">Select a council on either map for its profile.</p>
        </>
      )}
    </section>
  );
}

export function ProvisionPanel({
  provision,
  niProvision,
}: {
  provision: ProvisionState;
  niProvision: NIProvision | null;
}) {
  const { selectedCode, serviceStatus, sdzOn, sdzField } = useAppState();
  const dispatch = useAppDispatch();
  const rec =
    provision.status === "ok" && selectedCode ? provision.byCode[selectedCode] : null;

  const layerStatuses = useMemo(
    () =>
      (["greenspace", "trails", "accessPoints", "bluespace"] as const).map((id) => ({
        id,
        title: outscapeLayers[id].title,
        state: serviceStatus[id] ?? "idle",
      })),
    [serviceStatus],
  );

  return (
    <section className="pvp-panel right glass panel-section panel-scroll" aria-label="Provision — mapped greenspace">
      <p className="tagline" style={{ color: "var(--gani-lime)" }}>Provision · Greenspace NI Map</p>
      <h3>{selectedCode ? LGD_DISPLAY[selectedCode] : "Northern Ireland"}</h3>

      {rec ? (
        <>
          <div className="pvp-metric">
            <span>Households within 400 m of greenspace or trails</span>
            <span className="v accent">{fmtProvision(rec.pct400)}</span>
          </div>
          <div className="pvp-metric">
            <span>Within 1 km</span>
            <span className="v">{fmtProvision(rec.pct1km)}</span>
          </div>
          <div className="pvp-metric">
            <span>Within 2 km</span>
            <span className="v">{fmtProvision(rec.pct2km)}</span>
          </div>
          <p className="legend-note">
            Published provision indicators — GreenspaceNI council analysis
            {provision.status === "ok" && provision.year ? ` (${provision.year} vintage)` : ""},
            network analysis from access points, sites &gt; 2 ha.
          </p>
        </>
      ) : provision.status === "error" ? (
        <p className="legend-note" style={{ marginTop: 6 }}>
          The published provision indicators (GreenspaceNI Council Analysis 2025) are not
          reachable right now. The mapped layers below describe what the Greenspace NI Map
          holds; indicators will appear when the service is available.
        </p>
      ) : provision.status === "loading" ? (
        <p className="legend-note" style={{ marginTop: 6 }}>Loading published provision indicators…</p>
      ) : niProvision ? (
        <>
          <div className="pvp-metric">
            <span>NI households within 400 m of greenspace or trails</span>
            <span className="v accent">{fmtProvision(niProvision.pct400)}</span>
          </div>
          <div className="pvp-metric">
            <span>Within 1 km</span>
            <span className="v">{fmtProvision(niProvision.pct1km)}</span>
          </div>
          <div className="pvp-metric">
            <span>Within 2 km</span>
            <span className="v">{fmtProvision(niProvision.pct2km)}</span>
          </div>
          <p className="legend-note">
            Published NI-wide indicators{niProvision.year ? ` (${niProvision.year} vintage)` : ""}.
            Select a council for its own figures.
          </p>
        </>
      ) : (
        <p className="legend-note" style={{ marginTop: 6 }}>
          Select a council to see its published household-proximity indicators.
        </p>
      )}

      <p className="section-label" style={{ margin: "12px 0 4px" }}>Mapped evidence</p>
      {layerStatuses.map((l) => (
        <div className="pvp-metric" key={l.id}>
          <span>{l.title}</span>
          <span className="v" style={{ fontSize: 11, color: l.state === "error" ? "var(--gani-gold)" : "var(--gani-ink-3)" }}>
            {l.state === "ok" ? "live" : l.state === "loading" ? "loading…" : l.state === "error" ? "offline" : "—"}
          </span>
        </div>
      ))}

      <div className="layer-row" style={{ marginTop: 10 }}>
        <Switch
          checked={sdzOn}
          onChange={(on) => dispatch({ type: "sdz", on })}
          label="Neighbourhood provision surface (Super Data Zones)"
        />
        <span>Neighbourhood surface (SDZ)</span>
        <span className={`status ${serviceStatus["right:sdz"] === "error" ? "err" : ""}`}>
          {serviceStatus["right:sdz"] === "loading"
            ? "loading…"
            : serviceStatus["right:sdz"] === "error"
              ? "offline"
              : ""}
        </span>
      </div>
      {sdzOn && (
        <>
          <div className="format-toggle" style={{ marginTop: 8 }} role="group" aria-label="Proximity threshold">
            {([
              ["Percent400", "400 m"],
              ["Percent1km", "1 km"],
              ["Percent2km", "2 km"],
            ] as const).map(([f, label]) => (
              <button key={f} aria-pressed={sdzField === f} onClick={() => dispatch({ type: "sdzField", field: f })}>
                {label}
              </button>
            ))}
          </div>
          <div className="legend-swatches" style={{ marginTop: 6 }}>
            {sdzRamp.map((c, i) => (
              <div className="legend-row" key={c}>
                <span className="sw" style={{ background: c }} />
                <span>{sdzLabels[i]}</span>
              </div>
            ))}
          </div>
          <p className="legend-note">
            Households within {sdzField === "Percent400" ? "400 m" : sdzField === "Percent1km" ? "1 km" : "2 km"} of
            greenspace or trails, per Super Data Zone — {sdzVintageByField[sdzField]}{" "}
            analysis vintage
            {sdzField === "Percent2km" &&
              " (2 km was not computed in the 2026 analysis, so the latest vintage that includes it is shown)"}
            . These are published network-derived indicators; no live walking service-area
            (isochrone) analysis is available, so no travel-time zones are drawn.
          </p>
        </>
      )}

      <div className="note-box">
        <b>Two different kinds of evidence.</b> Survey scores measure how residents{" "}
        <i>perceive</i> greenspace; these indicators measure mapped provision. Where they
        tell different stories, that is a prompt for investigation — not a proven gap, and
        not a causal link.
      </div>
    </section>
  );
}
