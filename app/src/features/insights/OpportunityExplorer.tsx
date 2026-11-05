import { useEffect, useRef, useState } from "react";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import { themeSeries } from "../../config/branding";
import { LGD_DISPLAY, fmtIndex, integrity, lgd } from "../../data";
import { sdzProvision } from "../../config/services";
import { useAppDispatch } from "../../state/AppState";
import { fmtProvision, type NIProvision, type ProvisionRecord } from "../pvp/provision";
import type { ProvisionState } from "../pvp/PvpMode";

/**
 * Council screening: each council is checked against three transparent,
 * independently published indicators. No composite score is invented — a
 * council is listed when one or more indicators flag, and every indicator
 * value is shown so the reasoning is fully inspectable.
 */
export interface CouncilOpportunity {
  code: string;
  name: string;
  accessToIdx: number;
  pct400: number | null;
  flags: string[];
}

export function screenCouncils(
  provisionByCode: Record<string, ProvisionRecord> | null,
  niPct400: number | null,
): CouncilOpportunity[] {
  return lgd
    .map((r) => {
      const accessToIdx = r.themes_index.access_to;
      const pct400 = provisionByCode?.[r.lad_code]?.pct400 ?? null;
      const flags: string[] = [];
      if (accessToIdx < 96) flags.push("Perceived access well below the NI average (index < 96)");
      if (pct400 != null && niPct400 != null && pct400 < niPct400)
        flags.push("Mapped 400 m provision below the NI-wide figure");
      if (accessToIdx < 100 && pct400 != null && niPct400 != null && pct400 >= niPct400)
        flags.push("Perception lags mapped provision — worth understanding why");
      return { code: r.lad_code, name: LGD_DISPLAY[r.lad_code], accessToIdx, pct400, flags };
    })
    .filter((r) => r.flags.length > 0)
    .sort((a, b) => b.flags.length - a.flags.length || a.accessToIdx - b.accessToIdx);
}

interface SdzRow {
  code: string;
  name: string;
  pct400: number;
  pct1km: number | null;
}

/** Lowest household 400 m coverage SDZs — queried live, current vintage only. */
function useLowCoverageSdz(active: boolean): { rows: SdzRow[] | null; failed: boolean } {
  const [rows, setRows] = useState<SdzRow[] | null>(null);
  const [failed, setFailed] = useState(false);
  const attempted = useRef(false);
  useEffect(() => {
    if (!active) {
      attempted.current = false;
      return;
    }
    if (rows || attempted.current) return;
    attempted.current = true;
    const layer = new FeatureLayer({ url: sdzProvision.url });
    layer
      .queryFeatures({
        where: sdzProvision.definitionExpression ?? "1=1",
        outFields: ["SDZ_Name", "SDZ_Code", "Percent400", "Percent1km"],
        orderByFields: ["Percent400 ASC"],
        num: 12,
        returnGeometry: false,
      } as unknown as Parameters<FeatureLayer["queryFeatures"]>[0])
      .then((fs) => {
        setRows(
          fs.features.map((f) => ({
            code: String(f.attributes.SDZ_Code),
            name: String(f.attributes.SDZ_Name),
            pct400: Number(f.attributes.Percent400),
            pct1km: f.attributes.Percent1km == null ? null : Number(f.attributes.Percent1km),
          })),
        );
      })
      .catch(() => setFailed(true));
  }, [active, rows]);
  return { rows, failed };
}

export function OpportunityExplorer({
  provision,
  niProvision,
  active,
}: {
  provision: ProvisionState;
  niProvision: NIProvision | null;
  active: boolean;
}) {
  const dispatch = useAppDispatch();
  const byCode = provision.status === "ok" ? provision.byCode : null;
  const councils = screenCouncils(byCode, niProvision?.pct400 ?? null);
  const sdz = useLowCoverageSdz(active);

  const toMap = (code: string) => {
    dispatch({ type: "mode", mode: "explore" });
    dispatch({ type: "metric", metric: "access_to" });
    dispatch({ type: "select", code });
  };

  return (
    <div>
      <section className="prose-block glass">
        <h3>Where might improvement warrant investigation?</h3>
        <p style={{ margin: "2px 0 0" }}>
          A transparent screen, not a ranking: a council appears when one or more published
          indicators flag it, and every indicator value is shown. Flagged areas are{" "}
          <b>starting points for further investigation</b> — not approved priorities, and
          not proof of a deficit.
        </p>
        {councils.length > 0 ? (
          <table className="opportunity-table">
            <thead>
              <tr>
                <th>Council</th>
                <th>Access To index</th>
                <th>400 m provision</th>
                <th>Why it's flagged</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {councils.map((c) => (
                <tr key={c.code}>
                  <td>{c.name}</td>
                  <td className="num" style={{ color: c.accessToIdx < 96 ? themeSeries.access_to : undefined }}>
                    {fmtIndex(c.accessToIdx)}
                  </td>
                  <td className="num">
                    {c.pct400 != null ? fmtProvision(c.pct400) : "—"}
                    {niProvision?.pct400 != null && <small> (NI {fmtProvision(niProvision.pct400)})</small>}
                  </td>
                  <td>
                    <ul className="flag-list">
                      {c.flags.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                  </td>
                  <td>
                    <button className="exec-link" onClick={() => toMap(c.code)}>on the map →</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="legend-note" style={{ marginTop: 8 }}>
            {byCode
              ? "No council currently trips a screening indicator."
              : "Provision indicators load live from the published analysis service — perception-only screening is shown until it responds."}
          </p>
        )}
        <p className="legend-note">
          Indicators: published Access To index vs the NI average of 100 (POMNI 2025, "well
          below" uses the map's own &lt;96 class); published % of households within 400 m vs
          the NI-wide figure{provision.status === "ok" && provision.year ? ` (${provision.year} analysis)` : ""}.{" "}
          {integrity.significance}.
        </p>
      </section>

      <section className="prose-block glass">
        <h3>Neighbourhoods with the least walkable access</h3>
        <p style={{ margin: "2px 0 0" }}>
          The twelve Super Data Zones with the lowest published share of households within
          400 m of mapped greenspace or trails — queried live from the current analysis.
        </p>
        {sdz.rows ? (
          <table className="opportunity-table">
            <thead>
              <tr>
                <th>Super Data Zone</th>
                <th>Within 400 m</th>
                <th>Within 1 km</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {sdz.rows.map((r) => (
                <tr key={r.code}>
                  <td>{r.name}</td>
                  <td className="num">{fmtProvision(r.pct400)}</td>
                  <td className="num">{r.pct1km != null ? fmtProvision(r.pct1km) : "—"}</td>
                  <td>
                    <button
                      className="exec-link"
                      onClick={() => {
                        dispatch({ type: "mode", mode: "access" });
                        dispatch({ type: "zoomSdz", code: r.code });
                      }}
                    >
                      on the map →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : sdz.failed ? (
          <p className="legend-note" style={{ marginTop: 8 }}>
            The Super Data Zone service can't be reached right now — this list appears when
            it can be queried.
          </p>
        ) : (
          <p className="legend-note" style={{ marginTop: 8 }}>Querying the published surface…</p>
        )}
        <p className="legend-note">
          Rural SDZs can have low <i>mapped</i> coverage while informal access exists — low
          coverage here means "far from <b>mapped</b> greenspace or trails", which is itself
          a reason these areas merit a closer look rather than a verdict on them.
        </p>
      </section>
    </div>
  );
}
