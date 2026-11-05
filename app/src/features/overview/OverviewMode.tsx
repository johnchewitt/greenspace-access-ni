import { useEffect, useRef, useState } from "react";
import { palette, themeSeries } from "../../config/branding";
import { LGD_DISPLAY, fmtPct, integrity, lgd, ni } from "../../data";
import { useAppDispatch, type Mode } from "../../state/AppState";
import { fmtProvision, type NIProvision } from "../pvp/provision";
import { classifyQuadrants, interpretQuadrants } from "../pvp/quadrant";
import type { ProvisionState } from "../pvp/PvpMode";
import { fmtHa, fmtInt, useInsightStats } from "../insights/useInsightStats";

/**
 * Count-up animation for headline numbers. Animates only when the value is a
 * real number and the user hasn't asked for reduced motion; otherwise renders
 * the final value immediately. Numbers are never invented — a null stays "—".
 */
function useCountUp(target: number | null, duration = 1100): number | null {
  const [value, setValue] = useState<number | null>(
    typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? target
      : target == null
        ? null
        : 0,
  );
  const raf = useRef<number>(0);
  useEffect(() => {
    if (target == null) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = reduced ? 1 : Math.min((t - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(target * eased);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return value;
}

function HeroStat({
  value,
  render,
  label,
  sub,
  color,
}: {
  value: number | null;
  render: (v: number | null) => string;
  label: string;
  sub: string;
  color: string;
}) {
  const v = useCountUp(value);
  return (
    <div className="hero-stat" style={{ "--hs": color } as React.CSSProperties}>
      <b>{render(v)}</b>
      <span>{label}</span>
      <small>{sub}</small>
    </div>
  );
}

const SECTIONS: { mode: Mode; title: string; blurb: string }[] = [
  { mode: "explore", title: "Explore", blurb: "The index on the map — 11 councils, every published score" },
  { mode: "understand", title: "Standards", blurb: "The proposed standards, the questions behind them, the scoring method" },
  { mode: "access", title: "Accessibility", blurb: "Household walking access at 400 m, 1 km and 2 km" },
  { mode: "insights", title: "Insights", blurb: "Dashboards, comparisons and opportunity screening" },
  { mode: "pvp", title: "Perception vs Provision", blurb: "What residents feel beside what the map shows — the signature view" },
  { mode: "story", title: "Our Greenspace Story", blurb: "A six-chapter guided tour of the evidence" },
];

export function OverviewMode({
  provision,
  niProvision,
}: {
  provision: ProvisionState;
  niProvision: NIProvision | null;
}) {
  const dispatch = useAppDispatch();
  const stats = useInsightStats(true);

  const quad =
    provision.status === "ok"
      ? classifyQuadrants(provision.byCode, niProvision?.pct400 ?? null)
      : null;

  const provRows =
    provision.status === "ok"
      ? lgd
          .map((r) => ({ code: r.lad_code, name: LGD_DISPLAY[r.lad_code], v: provision.byCode[r.lad_code]?.pct400 ?? null }))
          .filter((r): r is { code: string; name: string; v: number } => r.v != null)
          .sort((a, b) => b.v - a.v)
      : [];

  return (
    <div className="overlay-stage overview-stage" role="region" aria-label="Overview">
      <div className="overlay-inner">
        <section className="hero glass-strong">
          <p className="section-label">Outscape · Greenspace NI · proposed standards evidence base</p>
          <h1 className="hero-headline">
            Better Greenspace.<br />Better Places. <em>Better Lives.</em>
          </h1>
          <p className="hero-lede">
            Explore greenspace provision, accessibility and the evidence behind Northern
            Ireland's emerging greenspace standards — the mapped estate beside what 4,000
            residents said about it.
          </p>
          <div className="hero-cta">
            <button className="primary" onClick={() => dispatch({ type: "mode", mode: "explore" })}>
              Explore the map →
            </button>
            <button onClick={() => dispatch({ type: "mode", mode: "story" })}>
              Our greenspace story
            </button>
            <button onClick={() => dispatch({ type: "mode", mode: "pvp" })}>
              Perception vs provision
            </button>
          </div>
          <div className="hero-stats">
            <HeroStat
              value={ni.totalPct}
              render={(v) => (v == null ? "—" : `${Math.round(v)}%`)}
              label="overall index score"
              sub="survey perceptions · POMNI 2025"
              color={palette.turquoise}
            />
            <HeroStat
              value={ni.themesPct.access_to}
              render={(v) => (v == null ? "—" : `${Math.round(v)}%`)}
              label="perceived access to greenspace"
              sub="the weakest theme"
              color={themeSeries.access_to}
            />
            <HeroStat
              value={stats?.greenspaceHa ?? null}
              render={(v) => (v == null ? "—" : `${Math.round(v).toLocaleString("en-GB")}`)}
              label="hectares of mapped greenspace"
              sub="live from the Greenspace NI Map"
              color={palette.lime}
            />
            <HeroStat
              value={niProvision?.pct400 ?? null}
              render={(v) => (v == null ? "—" : `${v.toFixed(1)}%`)}
              label="households within a 400 m walk"
              sub={niProvision?.year ? `mapped analysis · ${niProvision.year} vintage` : "mapped analysis"}
              color="#7FAEF5"
            />
          </div>
        </section>

        <section className="exec glass" aria-label="Executive summary">
          <div className="exec-head">
            <h2>The evidence at a glance</h2>
            <button
              className="report-btn"
              onClick={() => dispatch({ type: "report", open: true })}
              title="Generate a branded summary of the national evidence"
            >
              Create report
            </button>
          </div>
          <div className="exec-grid">
            <article>
              <h3>People value their greenspaces…</h3>
              <p>
                Perceived <b style={{ color: themeSeries.benefits }}>benefits ({fmtPct(ni.themesPct.benefits)})</b> and{" "}
                <b style={{ color: themeSeries.quality }}>quality ({fmtPct(ni.themesPct.quality)})</b> score far above
                perceived <b style={{ color: themeSeries.access_to }}>access to greenspace ({fmtPct(ni.themesPct.access_to)})</b> —
                the index's consistent weak point across Northern Ireland.
              </p>
              <button className="exec-link" onClick={() => dispatch({ type: "mode", mode: "understand" })}>
                The standards behind the scores →
              </button>
            </article>
            <article>
              <h3>…and the map points the same way</h3>
              <p>
                {niProvision?.pct400 != null ? (
                  <>
                    <b style={{ color: "#7FAEF5" }}>{fmtProvision(niProvision.pct400)}</b> of households are within a
                    400 m walk of mapped greenspace or trails
                    {niProvision.year ? ` (${niProvision.year} analysis)` : ""}, rising to{" "}
                    <b style={{ color: "#7FAEF5" }}>{fmtProvision(niProvision.pct2km)}</b> within 2 km.
                  </>
                ) : (
                  "Household walking-access figures are queried live from the published analysis and will appear when the service is reachable."
                )}{" "}
                The 400 m threshold relates to the Programme for Government "5-minute walk" ambition.
              </p>
              <button className="exec-link" onClick={() => dispatch({ type: "mode", mode: "access" })}>
                Walking access in detail →
              </button>
            </article>
            <article>
              <h3>Where the two diverge</h3>
              <p>
                {quad
                  ? interpretQuadrants(quad)
                  : "Council-by-council divergence between perception and mapped provision is classified live in the Perception vs Provision view."}
              </p>
              <button className="exec-link" onClick={() => dispatch({ type: "mode", mode: "pvp" })}>
                Perception vs provision →
              </button>
            </article>
            <article>
              <h3>Provision varies by council</h3>
              {provRows.length > 0 ? (
                <p>
                  Households within 400 m range from{" "}
                  <b style={{ color: palette.lime }}>{fmtProvision(provRows[0].v)}</b> in {provRows[0].name} to{" "}
                  <b style={{ color: themeSeries.access_to }}>{fmtProvision(provRows[provRows.length - 1].v)}</b> in{" "}
                  {provRows[provRows.length - 1].name}
                  {provision.status === "ok" && provision.year ? ` (${provision.year} analysis)` : ""}.
                </p>
              ) : (
                <p>Council provision figures load live from the published analysis service.</p>
              )}
              <button
                className="exec-link"
                onClick={() => {
                  dispatch({ type: "mode", mode: "insights" });
                  dispatch({ type: "insightsTab", tab: "opportunities" });
                }}
              >
                Opportunity screening →
              </button>
            </article>
          </div>
          <p className="legend-note" style={{ marginTop: 10 }}>
            {integrity.status}. {integrity.significance}. Live figures:{" "}
            {fmtInt(stats?.greenspaceCount ?? null)} mapped greenspace sites,{" "}
            {fmtInt(stats?.trailCount ?? null)} off-road trails,{" "}
            {fmtHa(stats?.greenspaceHa ?? null)} in total — queried from the Greenspace NI
            Map services at view time.
          </p>
        </section>

        <section className="section-cards" aria-label="Application sections">
          {SECTIONS.map((s) => (
            <button key={s.mode} className="section-card glass" onClick={() => dispatch({ type: "mode", mode: s.mode })}>
              <b>{s.title}</b>
              <span>{s.blurb}</span>
              <i aria-hidden="true">→</i>
            </button>
          ))}
        </section>
      </div>
    </div>
  );
}
