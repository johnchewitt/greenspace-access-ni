import { integrity } from "../../data";
import { sdzLabels, sdzRamp } from "../../map/renderers";
import { sdzVintageByField } from "../../config/services";
import { Switch } from "../../components/shared";
import { useAppDispatch, useAppState, type SdzField } from "../../state/AppState";
import { fmtProvision, type NIProvision } from "../pvp/provision";

const THRESHOLDS: { field: SdzField; label: string; walk: string }[] = [
  { field: "Percent400", label: "400 m", walk: "≈ 5-minute walk" },
  { field: "Percent1km", label: "1 km", walk: "≈ 12-minute walk" },
  { field: "Percent2km", label: "2 km", walk: "≈ 25-minute walk" },
];

export function AccessPanel({ niProvision }: { niProvision: NIProvision | null }) {
  const { sdzField, layers, serviceStatus } = useAppState();
  const dispatch = useAppDispatch();
  const sdzState = serviceStatus["sdz"];
  const active = THRESHOLDS.find((t) => t.field === sdzField)!;

  const niValue =
    niProvision == null
      ? null
      : sdzField === "Percent400"
        ? niProvision.pct400
        : sdzField === "Percent1km"
          ? niProvision.pct1km
          : niProvision.pct2km;

  return (
    <aside className="panel-left glass-strong access-panel" aria-label="Walking access controls">
      <p className="section-label">Accessibility · walking access</p>
      <h2 className="panel-title">Who lives near greenspace?</h2>
      <p className="panel-copy">
        The published Greenspace NI analysis measures the share of <b>households</b> within
        a walking distance of mapped greenspace or trails, for every Super Data Zone in
        Northern Ireland.
      </p>

      <div className="format-toggle" role="group" aria-label="Walking distance threshold">
        {THRESHOLDS.map((t) => (
          <button
            key={t.field}
            aria-pressed={sdzField === t.field}
            onClick={() => dispatch({ type: "sdzField", field: t.field })}
          >
            {t.label}
          </button>
        ))}
      </div>
      <p className="format-hint">
        {active.label} {active.walk}
        {niValue != null && (
          <>
            {" "}
            · NI-wide: <b style={{ color: "#7FAEF5" }}>{fmtProvision(niValue)}</b> of households
            {niProvision?.year ? ` (${niProvision.year} analysis)` : ""}
          </>
        )}
      </p>

      <div className="legend-swatches" style={{ marginTop: 8 }}>
        {sdzRamp.map((c, i) => (
          <div className="legend-row" key={c}>
            <i className="sw" style={{ background: c }} />
            <span>{sdzLabels[i]}</span>
          </div>
        ))}
      </div>
      <p className="legend-note">
        Households within {active.label} of greenspace or trails, per Super Data Zone —{" "}
        {sdzVintageByField[sdzField]} analysis vintage
        {sdzField === "Percent2km" && " (2 km was not computed in the 2026 analysis, so the latest vintage that includes it is shown)"}
        .
      </p>
      <span className={`status ${sdzState === "error" ? "err" : ""}`}>
        {sdzState === "loading"
          ? "Loading the published surface…"
          : sdzState === "error"
            ? "Surface unavailable — the live service can't be reached right now."
            : "Published surface · live service"}
      </span>

      <div style={{ marginTop: 12 }}>
        <div className="layer-row">
          <Switch
            checked={layers.greenspace}
            onChange={(on) => dispatch({ type: "layer", layer: "greenspace", on })}
            label="Greenspace sites"
          />
          <span>Greenspace sites</span>
        </div>
        <div className="layer-row">
          <Switch
            checked={layers.accessPoints}
            onChange={(on) => dispatch({ type: "layer", layer: "accessPoints", on })}
            label="Access points (sites ≥ 2 ha)"
          />
          <span>Access points (≥ 2 ha)</span>
        </div>
        <div className="layer-row">
          <Switch
            checked={layers.settlements}
            onChange={(on) => dispatch({ type: "layer", layer: "settlements", on })}
            label="Settlement footprints (OSNI)"
          />
          <span>Settlement footprints (OSNI)</span>
        </div>
      </div>

      <details className="help-details">
        <summary>How to read this view</summary>
        <p>
          A <b>Super Data Zone</b> is a small statistical area (NISRA, 2021 census
          geography) — small enough to show neighbourhood patterns that council averages
          hide. Darker blues mean fewer households within the chosen walk of mapped
          greenspace or trails.
        </p>
        <p>
          Figures come from the published network analysis of the Greenspace NI Map (access
          points, against the Programme for Government "5-minute walk" ambition). No live
          walking-time (isochrone) analysis is computed by this application — nothing here
          is approximated with circular buffers.
        </p>
        <p>{integrity.basis}.</p>
      </details>
    </aside>
  );
}
