import { useEffect, useRef, type ReactNode } from "react";
import { APP_NAME, APP_SUBTITLE } from "../config/branding";
import { integrity } from "../data";
import { useAppDispatch, useAppState } from "../state/AppState";

function Modal({ onClose, children, label }: { onClose: () => void; children: ReactNode; label: string }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="modal-scrim" role="dialog" aria-modal="true" aria-label={label} onClick={onClose}>
      <div className="modal glass-strong" onClick={(e) => e.stopPropagation()}>
        <button ref={closeRef} className="icon-btn close" aria-label="Close" onClick={onClose}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
        {children}
      </div>
    </div>
  );
}

export function MethodologyModal() {
  const { methodologyOpen } = useAppState();
  const dispatch = useAppDispatch();
  if (!methodologyOpen) return null;
  return (
    <Modal label="Data and methodology" onClose={() => dispatch({ type: "methodology", open: false })}>
      <h2>Data &amp; methodology</h2>
      <p>{integrity.source}</p>

      <h3>What the index measures</h3>
      <p>
        The proposed Greenspace Standards Index converts POMNI survey responses (questions
        Q14 and Q15) into four equally weighted theme scores — Accessibility To Greenspace,
        Access Within Greenspace, Quality and Benefits — averaged into one overall score per
        respondent, then aggregated by geography and population group. {integrity.basis}.
      </p>

      <h3>Score formats</h3>
      <ul>
        <li><b>Percentage of maximum</b> — absolute performance; 100% is the highest possible score. Northern Ireland overall: 77%.</li>
        <li><b>Index (NI = 100)</b> — relative to the Northern Ireland average; 110 ≈ 10% above average, 90 ≈ 10% below.</li>
        <li><b>Decile rankings</b> — proposed in the report for mapping; no decile values are published in the interim report, so none appear here.</li>
      </ul>

      <h3>Reliability</h3>
      <ul>
        <li>{integrity.survey}.</li>
        <li>{integrity.status}.</li>
        <li>{integrity.threshold}; {integrity.moe}.</li>
        <li>{integrity.significance}.</li>
        <li>{integrity.lgdSamples}.</li>
        <li>Published percentage and index series are shown exactly as published and are never recomputed from one another.</li>
      </ul>

      <h3>Objective provision data</h3>
      <p>
        Greenspace, trail, access-point and bluespace layers, and the published
        household-proximity indicators, come live from the Greenspace NI Map services
        (Outdoor Recreation NI / Outscape, funded by DAERA &amp; DfI). Perception scores are
        never equated with these measured-provision indicators.
      </p>

      <h3>Classification</h3>
      <p>
        Map classes use defined (manual) intervals — identical across every theme and view —
        so maps stay comparable. Class edges are stated in the legend.
      </p>
    </Modal>
  );
}

export function AboutModal() {
  const { infoOpen } = useAppState();
  const dispatch = useAppDispatch();
  if (!infoOpen) return null;
  return (
    <Modal label="About" onClose={() => dispatch({ type: "info", open: false })}>
      <h2>{APP_NAME}</h2>
      <p>{APP_SUBTITLE}</p>
      <p>
        A companion to Outscape's Greenspace NI Map: it pairs residents' perceptions of
        their local greenspaces (the proposed survey-based Greenspace Standards Index) with
        the objective provision mapping Outscape already publishes.
      </p>
      <h3>Using the app</h3>
      <ul>
        <li><b>Explore</b> — the index across Northern Ireland's 11 councils; switch theme and score format, select a council for its profile.</li>
        <li><b>Understand</b> — how the index is built from POMNI questions, and what it does and doesn't measure.</li>
        <li><b>Compare</b> — all 11 councils side by side, plus demographic patterns.</li>
        <li><b>Perception vs Provision</b> — what residents experience alongside what the map shows, geographically synchronised.</li>
      </ul>
      <h3>Attribution</h3>
      <p style={{ fontSize: 12 }}>
        Greenspace Standards Index: 56 Degree Insight analysis of POMNI 2025 (interim,
        proposed methodology) for Outscape. Greenspace, trails, access points &amp;
        provision analysis: GreenspaceNI Map, Outdoor Recreation NI / Outscape, funded by
        DAERA &amp; DfI — contains public sector information licensed under the Open
        Government Licence v3.0; © Crown copyright and database right Land &amp; Property
        Services, NIMA MOU577.2. Council boundaries derived from OSNI Open Data (OGL v3).
        Basemap © OpenStreetMap contributors, © Esri.
      </p>
    </Modal>
  );
}

export function AttributionChip() {
  const dispatch = useAppDispatch();
  return (
    <div className="attribution-chip glass">
      Index: 56 Degree Insight · POMNI 2025 (interim) · GIS: GreenspaceNI Map, ORNI/Outscape · OGL v3 · © Crown copyright LPS{" "}
      <button onClick={() => dispatch({ type: "info", open: true })}>full credits</button>
    </div>
  );
}
