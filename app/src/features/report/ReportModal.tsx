import { useEffect, useRef, useState } from "react";
import { APP_SUBTITLE, themeSeries } from "../../config/branding";
import {
  LGD_DISPLAY,
  THEME_ORDER,
  THEME_SHORT,
  fmtIndex,
  fmtPct,
  fmtPct1,
  integrity,
  lgdByCode,
  ni,
} from "../../data";
import type { MapController } from "../../map/MapController";
import { useAppDispatch, useAppState } from "../../state/AppState";
import { fmtProvision, type NIProvision } from "../pvp/provision";
import { QUADRANT_META, classifyQuadrants, interpretQuadrants } from "../pvp/quadrant";
import type { ProvisionState } from "../pvp/PvpMode";

/** Live capture of the main map for the report; omitted with a reason on failure. */
function MapSnapshot({ controller, areaName }: { controller: MapController; areaName: string }) {
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const view = controller.view;
    if (!view) {
      const t = window.setTimeout(() => !cancelled && setFailed(true), 0);
      return () => {
        cancelled = true;
        window.clearTimeout(t);
      };
    }
    view
      .takeScreenshot({ width: 1000, height: 640, format: "jpg", quality: 90 })
      .then((s) => !cancelled && setSnapshot(s.dataUrl))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [controller]);
  if (snapshot) return <img className="rp-map" src={snapshot} alt={`Map of ${areaName}`} />;
  return (
    <div className="rp-map rp-map-missing">
      {failed ? "Map snapshot omitted — the map could not be captured on this device." : "Capturing map…"}
    </div>
  );
}

/**
 * Branded, printable evidence summary for the current selection (a council, or
 * Northern Ireland overall). "Save as PDF" uses the browser's print-to-PDF on
 * an A4-landscape sheet — nothing is fabricated: live indicators that cannot
 * be retrieved are omitted with a stated reason.
 */
export function ReportModal({
  controller,
  provision,
  niProvision,
}: {
  controller: MapController;
  provision: ProvisionState;
  niProvision: NIProvision | null;
}) {
  const { reportOpen, selectedCode } = useAppState();
  const dispatch = useAppDispatch();
  const closeRef = useRef<HTMLButtonElement>(null);

  const council = selectedCode ? lgdByCode[selectedCode] : null;
  const areaName = selectedCode ? LGD_DISPLAY[selectedCode] : "Northern Ireland";
  const byCode = provision.status === "ok" ? provision.byCode : null;
  const prov = selectedCode ? (byCode?.[selectedCode] ?? null) : null;
  const quad = byCode ? classifyQuadrants(byCode, niProvision?.pct400 ?? null) : null;
  const quadPoint = quad && selectedCode ? (quad.points.find((p) => p.code === selectedCode) ?? null) : null;

  useEffect(() => {
    if (reportOpen) closeRef.current?.focus();
  }, [reportOpen]);

  useEffect(() => {
    if (!reportOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        dispatch({ type: "report", open: false });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [reportOpen, dispatch]);

  if (!reportOpen) return null;

  const dateStr = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="modal-scrim report-scrim" role="dialog" aria-modal="true" aria-label={`Evidence summary for ${areaName}`}>
      <div className="report-shell glass-strong">
        <div className="report-toolbar">
          <span>
            Evidence summary — <b>{areaName}</b>
          </span>
          <div>
            <button className="primary" onClick={() => window.print()}>
              Save as PDF
            </button>
            <button ref={closeRef} onClick={() => dispatch({ type: "report", open: false })}>
              Close
            </button>
          </div>
        </div>

        <div className="report-sheet" id="report-sheet">
          <header className="rp-head">
            <div>
              <div className="rp-brand">
                Greenspace <em>Access</em> NI
              </div>
              <div className="rp-sub">{APP_SUBTITLE}</div>
            </div>
            <div className="rp-meta">
              <b>{areaName}</b>
              <span>Generated {dateStr}</span>
              <span>Interim evidence · proposed methodology</span>
            </div>
          </header>

          <div className="rp-grid">
            <section className="rp-col">
              <h4>Survey perceptions — POMNI 2025</h4>
              <div className="rp-kpis">
                <div>
                  <b>{council ? fmtPct1(council.total_pct) : fmtPct(ni.totalPct)}</b>
                  <span>overall · % of maximum</span>
                </div>
                {council && (
                  <div>
                    <b>{fmtIndex(council.total_index)}</b>
                    <span>overall index (NI = 100)</span>
                  </div>
                )}
              </div>
              <table className="rp-table">
                <tbody>
                  {THEME_ORDER.map((t) => (
                    <tr key={t}>
                      <td>
                        <i className="rp-dot" style={{ background: themeSeries[t] }} />
                        {THEME_SHORT[t]}
                      </td>
                      <td className="num">
                        {council ? `${fmtIndex(council.themes_index[t])} (index)` : fmtPct(ni.themesPct[t])}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="rp-note">
                {council
                  ? "Council theme scores are published as indices against the NI average (100)."
                  : "National theme scores are published as % of the maximum possible."}{" "}
                {integrity.basis}.
              </p>

              <h4>Walking access — mapped provision</h4>
              {(selectedCode ? prov : niProvision) ? (
                <table className="rp-table">
                  <tbody>
                    <tr>
                      <td>Households within 400 m</td>
                      <td className="num">{fmtProvision(selectedCode ? prov!.pct400 : niProvision!.pct400)}</td>
                    </tr>
                    <tr>
                      <td>Within 1 km</td>
                      <td className="num">{fmtProvision(selectedCode ? prov!.pct1km : niProvision!.pct1km)}</td>
                    </tr>
                    <tr>
                      <td>Within 2 km</td>
                      <td className="num">{fmtProvision(selectedCode ? prov!.pct2km : niProvision!.pct2km)}</td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <p className="rp-note">
                  Omitted: the live provision service could not be reached when this report
                  was generated.
                </p>
              )}
              <p className="rp-note">
                {(selectedCode ? prov?.year : niProvision?.year)
                  ? `${selectedCode ? prov!.year : niProvision!.year} analysis vintage · `
                  : ""}
                Greenspace NI Map network analysis; the 400 m threshold relates to the
                Programme for Government "5-minute walk" ambition without constituting a
                formal assessment.
              </p>
            </section>

            <section className="rp-col">
              <MapSnapshot controller={controller} areaName={areaName} key={selectedCode ?? "ni"} />
              <p className="rp-note">
                Map: Greenspace Standards Index (survey perceptions) over council boundaries.
                © OpenStreetMap contributors, © Esri.
              </p>

              <h4>Perception vs provision</h4>
              <p className="rp-body">
                {quadPoint ? (
                  <>
                    {areaName} sits in the <b>{QUADRANT_META[quadPoint.quadrant].label}</b>{" "}
                    quadrant: overall index {quadPoint.index.toFixed(1)} against the NI
                    average of 100, with {quadPoint.pct400.toFixed(1)}% of households within
                    400 m against the reference of {quad!.provisionRef.toFixed(1)}%.
                    Divergence is a prompt for further investigation, not a proven gap or a
                    causal claim.
                  </>
                ) : quad && !selectedCode ? (
                  interpretQuadrants(quad)
                ) : (
                  "Omitted: the council-by-council comparison needs the live provision service, which could not be reached when this report was generated."
                )}
              </p>

              <h4>Applicable standards</h4>
              <p className="rp-body">
                The proposed Greenspace Standards Index (four equally weighted themes from
                POMNI 2025) is an interim, consultative methodology. The one defined spatial
                threshold shown in this application is the Programme for Government ambition
                of a 5-minute (400 m) walk to quality greenspace.
              </p>
            </section>
          </div>

          <footer className="rp-foot">
            <span>
              Sources: 56 Degree Insight / POMNI 2025 (interim report v2, July 2026) ·
              GreenspaceNI Map, ORNI/Outscape (live services) · OGL v3 · © Crown copyright
              and database right LPS, NIMA MOU577.2 · Boundaries: OSNI Open Data
            </span>
            <span>{integrity.significance}</span>
          </footer>
        </div>
      </div>
    </div>
  );
}
