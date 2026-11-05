import { useEffect, useRef } from "react";
import { useAppDispatch, useAppState } from "../state/AppState";

const STEPS: { title: string; body: string }[] = [
  {
    title: "Welcome to Greenspace Access NI",
    body: "Two kinds of evidence about Northern Ireland's greenspace in one place: what the map shows, and what 4,000 residents said about it. This 60-second tour shows you around.",
  },
  {
    title: "Eight views, one map",
    body: "The navigation bar moves between views — the map underneath stays put. EXPLORE is the index on the map; STANDARDS explains the scoring; ACCESSIBILITY shows household walking access; INSIGHTS holds dashboards, comparisons and opportunity screening.",
  },
  {
    title: "The signature view",
    body: "PERCEPTION VS PROVISION puts what residents feel beside what the map shows, side by side and geographically synchronised. Open the evidence drawer at the bottom to compare all 11 councils in four quadrants.",
  },
  {
    title: "Click anything",
    body: "Click a council on the map (or search, top right) for its full profile. Charts are clickable too — a bar or a scatter point takes you to that council. Use the ⌂ button on the map to reset the view at any time.",
  },
  {
    title: "Honest numbers, always",
    body: "Every figure is a published survey value or a live query of Outscape's public services, labelled with sample sizes, vintages and margins of error. 'Create report' turns the current selection into a branded PDF summary. Enjoy!",
  },
];

const DONE_KEY = "gani-tour-done";

export function tourAlreadySeen(): boolean {
  try {
    return localStorage.getItem(DONE_KEY) === "1";
  } catch {
    return true; // storage unavailable → never nag
  }
}

function markSeen() {
  try {
    localStorage.setItem(DONE_KEY, "1");
  } catch {
    /* fine */
  }
}

export function Tour() {
  const { tourStep } = useAppState();
  const dispatch = useAppDispatch();
  const nextRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (tourStep != null) nextRef.current?.focus();
  }, [tourStep]);

  useEffect(() => {
    if (tourStep == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        markSeen();
        dispatch({ type: "tour", step: null });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tourStep, dispatch]);

  if (tourStep == null) return null;
  const step = STEPS[Math.min(tourStep, STEPS.length - 1)];
  const last = tourStep >= STEPS.length - 1;

  const close = () => {
    markSeen();
    dispatch({ type: "tour", step: null });
  };

  return (
    <div className="modal-scrim tour-scrim" role="dialog" aria-modal="true" aria-label="Application tour">
      <div className="tour-card glass-strong">
        <p className="section-label">
          Quick tour · {tourStep + 1} of {STEPS.length}
        </p>
        <h2>{step.title}</h2>
        <p>{step.body}</p>
        <div className="tour-dots" aria-hidden="true">
          {STEPS.map((s, i) => (
            <i key={s.title} className={i === tourStep ? "on" : ""} />
          ))}
        </div>
        <div className="story-controls" style={{ marginTop: 14 }}>
          {tourStep > 0 && (
            <button onClick={() => dispatch({ type: "tour", step: tourStep - 1 })}>← Back</button>
          )}
          <button
            ref={nextRef}
            className="primary"
            onClick={() => (last ? close() : dispatch({ type: "tour", step: tourStep + 1 }))}
          >
            {last ? "Start exploring →" : "Next →"}
          </button>
          {!last && (
            <button className="exit" onClick={close}>
              Skip
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
