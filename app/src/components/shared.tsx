import type { ReactNode } from "react";
import { integrity } from "../data";
import { useAppDispatch, useAppState } from "../state/AppState";
import { legendEntries } from "../map/renderers";
import type { FormatId, MetricId } from "../data";

/** Persistent interim/perception status chip (binding integrity rule). */
export function IntegrityChip() {
  const dispatch = useAppDispatch();
  return (
    <button
      className="integrity-chip glass"
      style={{ border: "1px solid rgba(226,183,107,0.28)", cursor: "pointer" }}
      onClick={() => dispatch({ type: "methodology", open: true })}
      title="Open data & methodology notes"
    >
      <strong>Interim</strong>
      <span className="sep">·</span>
      <span>Proposed index — survey perceptions, POMNI 2025</span>
      <span className="sep">·</span>
      <span>n = 4,000</span>
    </button>
  );
}

export function SampleSizeBadge({ n }: { n: number | null }) {
  return (
    <span
      style={{
        display: "inline-flex",
        padding: "2px 8px",
        borderRadius: 999,
        background: "rgba(67,220,193,0.1)",
        fontSize: 10.5,
        fontWeight: 700,
        color: "var(--gani-ink-2)",
      }}
      title={n ? `${n} POMNI respondents` : integrity.lgdSamples}
    >
      {n ? `n = ${n}` : "council n not published"}
    </span>
  );
}

export function UncertaintyNote({ children }: { children?: ReactNode }) {
  return (
    <div className="note-box" role="note">
      <b>Reading these results.</b> {children ?? (
        <>
          Scores reflect how POMNI respondents <i>perceive</i> their local
          greenspaces — not measured provision. {integrity.significance}.
        </>
      )}
    </div>
  );
}

/** Custom map legend with units, classification statement and format context. */
export function MapLegend({ metric, format }: { metric: MetricId; format: FormatId }) {
  const entries = legendEntries(metric, format);
  const isIndex = metric !== "total" || format === "index";
  return (
    <section className="panel-section glass" aria-label="Map legend">
      <h2 className="section-label">Legend</h2>
      <div className="legend-swatches">
        {entries.map((e) => (
          <div className="legend-row" key={e.label}>
            <span className="sw" style={{ background: e.color }} />
            <span>{e.label}</span>
          </div>
        ))}
      </div>
      <p className="legend-note">
        {isIndex
          ? "Index relative to the Northern Ireland average (100). The ±2 centre band is well inside survey margins of error."
          : "Percentage of the maximum possible score (100% = highest possible)."}
        {" "}Defined class intervals, identical across all views.
      </p>
    </section>
  );
}

export function FormatToggle() {
  const { metric, format } = useAppState();
  const dispatch = useAppDispatch();
  const themeSelected = metric !== "total";
  return (
    <div>
      <div className="format-toggle" role="group" aria-label="Score format">
        <button
          aria-pressed={format === "pct" && !themeSelected}
          disabled={themeSelected}
          onClick={() => dispatch({ type: "format", format: "pct" })}
          title={
            themeSelected
              ? "Theme scores by council are published as indices only"
              : "Percentage of maximum possible score"
          }
        >
          % of maximum
        </button>
        <button
          aria-pressed={format === "index" || themeSelected}
          onClick={() => dispatch({ type: "format", format: "index" })}
          title="Index relative to the NI average (100)"
        >
          Index (NI = 100)
        </button>
      </div>
      <p className="format-hint">
        {themeSelected
          ? "Theme results by council are published as indices against the NI average — percentage views stay at national level."
          : format === "pct"
            ? "100% = highest possible score."
            : "100 = Northern Ireland average; 110 ≈ 10% above average."}
      </p>
    </div>
  );
}

export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (on: boolean) => void;
  label: string;
}) {
  return (
    <button
      className="switch"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
    />
  );
}
