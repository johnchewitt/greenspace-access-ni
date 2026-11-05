import { useEffect, useMemo, useState } from "react";
import { Chart } from "../../charts/Chart";
import { q15Option } from "../../charts/options";
import { palette, themeSeries } from "../../config/branding";
import { THEME_ORDER, THEME_SHORT, fmtPct, integrity, ni } from "../../data";
import type { MapController } from "../../map/MapController";
import {
  useAppDispatch,
  type Action,
} from "../../state/AppState";
import { fmtProvision, type NIProvision } from "../pvp/provision";
import { fmtHa, fmtInt, useInsightStats } from "../insights/useInsightStats";

interface Chapter {
  id: string;
  kicker: string;
  title: string;
  body: string[];
  /** global-state choreography, applied via the app's existing effects */
  dispatches: Action[];
  /** story-local map choreography */
  choropleth?: boolean;
}

const CHAPTERS: Chapter[] = [
  {
    id: "why",
    kicker: "Chapter 1",
    title: "Why greenspace matters",
    body: [
      "Parks, woodlands, trails, coast — the places people walk, breathe and meet. Asked about their local greenspaces, Northern Ireland's residents are emphatic: 83% of the maximum score for perceived benefits to mental health, physical activity and community.",
      "That near-consensus on value is the foundation of this evidence base — and the reason access to greenspace is worth measuring carefully.",
    ],
    dispatches: [
      { type: "select", code: null },
      { type: "metric", metric: "benefits" },
      { type: "basemap", style: "dark" },
      { type: "layer", layer: "greenspace", on: false },
      { type: "layer", layer: "trails", on: false },
      { type: "layer", layer: "accessPoints", on: false },
      { type: "layer", layer: "bluespace", on: false },
    ],
    choropleth: true,
  },
  {
    id: "mapped",
    kicker: "Chapter 2",
    title: "Understanding Northern Ireland's greenspace",
    body: [
      "The Greenspace NI Map brings together what is physically there: every mapped, publicly accessible greenspace of half a hectare or more, with the off-road trails that join them — assembled from more than fifty datasets and updated annually.",
      "This is the provision evidence: measured, mapped, countable.",
    ],
    dispatches: [
      { type: "select", code: null },
      { type: "basemap", style: "dark" },
      { type: "layer", layer: "greenspace", on: true },
      { type: "layer", layer: "trails", on: true },
    ],
    choropleth: false,
  },
  {
    id: "voices",
    kicker: "Chapter 3",
    title: "What people think",
    body: [
      "In 2025, four thousand residents answered the People in the Outdoors Monitor. Their perceptions form the proposed Greenspace Standards Index: an overall score of 77% of the maximum — positive, but with a telling weak spot.",
      "Perceived accessibility to greenspace scores just 65%, far below quality (80%) and benefits (83%). And one in five say their nearest greenspace is more than a thirty-minute walk away.",
    ],
    dispatches: [
      { type: "select", code: null },
      { type: "metric", metric: "total" },
      { type: "format", format: "pct" },
      { type: "layer", layer: "greenspace", on: false },
      { type: "layer", layer: "trails", on: false },
    ],
    choropleth: true,
  },
  {
    id: "pvp",
    kicker: "Chapter 4",
    title: "Perception vs provision",
    body: [
      "Two kinds of evidence, side by side. The survey says access feels like the weak point; the map's published analysis points the same way — under half of households are within a 400-metre walk of mapped greenspace or trails.",
      "Where perception and provision diverge for a council, that divergence is a prompt for investigation — never a proven gap, and never a causal claim.",
    ],
    dispatches: [
      { type: "select", code: null },
      { type: "metric", metric: "total" },
      { type: "format", format: "index" },
    ],
    choropleth: true,
  },
  {
    id: "standards",
    kicker: "Chapter 5",
    title: "The proposed standards",
    body: [
      "Four equally weighted themes — Accessibility To, Access Within, Quality, Benefits — each built from the survey questions residents actually answered, averaged into one transparent index.",
      "It is a proposed methodology, shared for feedback: consistent, replicable for future survey waves, and honest about its margins of error.",
    ],
    dispatches: [
      { type: "select", code: null },
      { type: "emphasize", codes: null },
    ],
    choropleth: true,
  },
  {
    id: "opportunities",
    kicker: "Chapter 6",
    title: "Where are the opportunities?",
    body: [
      "The index varies most on accessibility: Fermanagh & Omagh (84), Mid Ulster (88) and Armagh City, Banbridge & Craigavon (91) sit furthest below the NI average for perceived access to greenspace — highlighted on the map. The 400-metre provision surface in Perception vs Provision echoes the same rural pattern in dark blue.",
      "These are evidence-based starting points for further investigation: places where better access, new connections or better-known entrances could move both the map and the lived experience.",
    ],
    dispatches: [
      { type: "select", code: null },
      { type: "metric", metric: "access_to" },
      { type: "emphasize", codes: ["N09000006", "N09000009", "N09000002"] },
    ],
    choropleth: true,
  },
];

function ChapterVisual({ id, niProvision, statsActive }: { id: string; niProvision: NIProvision | null; statsActive: boolean }) {
  const stats = useInsightStats(statsActive);
  const q15 = useMemo(() => q15Option(), []);
  switch (id) {
    case "why":
      return (
        <div className="story-stats">
          <div>
            <b style={{ color: themeSeries.benefits }}>{fmtPct(ni.themesPct.benefits)}</b>
            <span>perceived benefits · % of maximum</span>
          </div>
          <div>
            <b style={{ color: themeSeries.access_within }}>{fmtPct(ni.themesPct.access_within)}</b>
            <span>feel safe, welcoming &amp; inclusive</span>
          </div>
        </div>
      );
    case "mapped":
      return (
        <div className="story-stats">
          <div>
            <b style={{ color: palette.lime }}>{fmtHa(stats?.greenspaceHa ?? null)}</b>
            <span>mapped greenspace (live)</span>
          </div>
          <div>
            <b style={{ color: palette.lime }}>{fmtInt(stats?.greenspaceCount ?? null)}</b>
            <span>sites · ≥ 0.5 ha</span>
          </div>
          <div>
            <b style={{ color: palette.turquoise }}>{fmtInt(stats?.trailCount ?? null)}</b>
            <span>off-road trails</span>
          </div>
        </div>
      );
    case "voices":
      return <Chart option={q15} className="chart-box" style={{ height: 190 }} ariaLabel="Walking time to nearest greenspace, survey distribution" />;
    case "pvp":
      return (
        <div className="story-stats">
          <div>
            <b style={{ color: themeSeries.access_to }}>{fmtPct(ni.themesPct.access_to)}</b>
            <span>perceived access to greenspace</span>
          </div>
          <div>
            <b style={{ color: "#7FAEF5" }}>{fmtProvision(niProvision?.pct400 ?? null)}</b>
            <span>households within 400 m (mapped{niProvision?.year ? `, ${niProvision.year}` : ""})</span>
          </div>
        </div>
      );
    case "standards":
      return (
        <div className="story-themes">
          {THEME_ORDER.map((t) => (
            <div key={t} style={{ "--tc": themeSeries[t] } as React.CSSProperties}>
              <b>{fmtPct(ni.themesPct[t])}</b>
              <span>{THEME_SHORT[t]}</span>
            </div>
          ))}
        </div>
      );
    case "opportunities":
      return (
        <div className="story-stats">
          <div>
            <b style={{ color: "#E8A94F" }}>84 · 88 · 91</b>
            <span>lowest Access To indices (NI = 100)</span>
          </div>
        </div>
      );
    default:
      return null;
  }
}

export function StoryMode({
  controller,
  niProvision,
}: {
  controller: MapController;
  niProvision: NIProvision | null;
}) {
  const dispatch = useAppDispatch();
  const [idx, setIdx] = useState(0);
  const chapter = CHAPTERS[idx];

  // Home the view once on entry
  useEffect(() => {
    void controller.select(null, true);
  }, [controller]);

  // Apply choreography on chapter change (map effects run via the app's
  // existing state effects, so there is a single writer per map property)
  useEffect(() => {
    chapter.dispatches.forEach((a) => dispatch(a));
    controller.setChoroplethVisible(chapter.choropleth ?? true);
  }, [chapter, controller, dispatch]);

  // Restore the map when leaving the story
  useEffect(
    () => () => {
      controller.setChoroplethVisible(true);
    },
    [controller],
  );

  // Keyboard navigation — never steal keys from form fields or open dialogs
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.closest("input, textarea, select, [contenteditable]") || t.isContentEditable))
        return;
      if (document.querySelector(".modal-scrim")) return; // dialog owns Escape
      if (e.key === "ArrowRight") setIdx((i) => Math.min(i + 1, CHAPTERS.length - 1));
      if (e.key === "ArrowLeft") setIdx((i) => Math.max(i - 1, 0));
      if (e.key === "Escape") dispatch({ type: "mode", mode: "explore" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dispatch]);

  return (
    <>
      <div className="story-progress glass-strong" role="tablist" aria-label="Story chapters">
        {CHAPTERS.map((c, i) => (
          <button
            key={c.id}
            role="tab"
            aria-selected={i === idx}
            aria-label={`${c.kicker}: ${c.title}`}
            className={i === idx ? "on" : ""}
            onClick={() => setIdx(i)}
          />
        ))}
      </div>
      <section className="story-panel glass-strong" aria-label={`${chapter.kicker}: ${chapter.title}`}>
        <p className="section-label" style={{ color: "var(--gani-gold)" }}>{chapter.kicker} · {idx + 1} of {CHAPTERS.length}</p>
        <h2>{chapter.title}</h2>
        {chapter.body.map((p) => (
          <p className="story-body" key={p.slice(0, 24)}>{p}</p>
        ))}
        <ChapterVisual id={chapter.id} niProvision={niProvision} statsActive={chapter.id === "mapped"} />
        {chapter.id === "pvp" && (
          <button className="story-link" onClick={() => dispatch({ type: "mode", mode: "pvp" })}>
            Open the full Perception vs Provision view →
          </button>
        )}
        {chapter.id === "opportunities" && (
          <button
            className="story-link"
            onClick={() => {
              dispatch({ type: "mode", mode: "pvp" });
              dispatch({ type: "sdz", on: true });
            }}
          >
            See the 400 m provision surface →
          </button>
        )}
        {chapter.id === "standards" && (
          <button className="story-link" onClick={() => dispatch({ type: "mode", mode: "understand" })}>
            Explore the standards in depth →
          </button>
        )}
        {idx === CHAPTERS.length - 1 && (
          <p className="legend-note" style={{ marginTop: 10 }}>
            {integrity.basis}. {integrity.significance}.
          </p>
        )}
        <div className="story-controls">
          <button onClick={() => setIdx((i) => Math.max(i - 1, 0))} disabled={idx === 0}>
            ← Back
          </button>
          {idx < CHAPTERS.length - 1 ? (
            <button className="primary" onClick={() => setIdx((i) => i + 1)}>
              Next →
            </button>
          ) : (
            <button className="primary" onClick={() => dispatch({ type: "mode", mode: "explore" })}>
              Explore the map yourself →
            </button>
          )}
          <button className="exit" onClick={() => dispatch({ type: "mode", mode: "explore" })}>
            Exit story
          </button>
        </div>
      </section>
    </>
  );
}
