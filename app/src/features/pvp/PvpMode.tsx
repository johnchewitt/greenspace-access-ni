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
import { councilProvision2025, outscapeLayers } from "../../config/services";
import { useAppState } from "../../state/AppState";
import { SampleSizeBadge } from "../../components/shared";

export interface ProvisionRecord {
  lgdName: string;
  pct400: number | null;
  pct1km: number | null;
  pct2km: number | null;
}

type ProvisionState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ok"; byCode: Record<string, ProvisionRecord> };

/**
 * Query the published council provision indicators once.
 * Codes in the service may be N09… or legacy LGD2014 — match on code first,
 * then on normalised name. Values are displayed exactly as published.
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
        outFields: ["LGDName", "LGDCode", "Percent400", "Percent1km", "Percent2km"],
        returnGeometry: false,
      })
      .then((fs) => {
        if (cancelled) return;
        const norm = (s: string) =>
          s.toLowerCase().replace(/city|and|&|borough|council|district|,|\s+/g, "");
        const nameToCode = Object.fromEntries(
          Object.entries(LGD_DISPLAY).map(([code, name]) => [norm(name), code]),
        );
        const byCode: Record<string, ProvisionRecord> = {};
        fs.features.forEach((f) => {
          const a = f.attributes as {
            LGDName?: string;
            LGDCode?: string;
            Percent400?: number;
            Percent1km?: number;
            Percent2km?: number;
          };
          const code =
            a.LGDCode && a.LGDCode.startsWith("N09")
              ? a.LGDCode
              : nameToCode[norm(a.LGDName ?? "")];
          if (!code) return;
          byCode[code] = {
            lgdName: a.LGDName ?? "",
            pct400: a.Percent400 ?? null,
            pct1km: a.Percent1km ?? null,
            pct2km: a.Percent2km ?? null,
          };
        });
        setState(
          Object.keys(byCode).length > 0 ? { status: "ok", byCode } : { status: "error" },
        );
      })
      .catch(() => !cancelled && setState({ status: "error" }));
    return () => {
      cancelled = true;
    };
  }, [active, state.status]);
  return state;
}

const fmtHh = (v: number | null) =>
  v == null ? "—" : `${v > 1 ? v.toFixed(1) : (v * 100).toFixed(1)}%`;

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

export function ProvisionPanel({ provision }: { provision: ProvisionState }) {
  const { selectedCode, serviceStatus } = useAppState();
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
            <span className="v accent">{fmtHh(rec.pct400)}</span>
          </div>
          <div className="pvp-metric">
            <span>Within 1 km</span>
            <span className="v">{fmtHh(rec.pct1km)}</span>
          </div>
          <div className="pvp-metric">
            <span>Within 2 km</span>
            <span className="v">{fmtHh(rec.pct2km)}</span>
          </div>
          <p className="legend-note">
            Published provision indicators — GreenspaceNI Council Analysis 2025 (network
            analysis from access points, sites &gt; 2 ha).
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

      <div className="note-box">
        <b>Two different kinds of evidence.</b> Survey scores measure how residents{" "}
        <i>perceive</i> greenspace; these indicators measure mapped provision. Where they
        tell different stories, that is a prompt for investigation — not a proven gap, and
        not a causal link.
      </div>
    </section>
  );
}
