import { useMemo, useState } from "react";
import { ni, THEME_SHORT, type ThemeId } from "../../data";
import { themeSeries } from "../../config/branding";
import { computeScores, Q14_STATEMENTS, Q14_SCALE, Q15_SCALE } from "./scoring";

/**
 * Interactive illustration of the published scoring method: pick answers for
 * one hypothetical respondent and watch the four theme scores and overall
 * score form. Clearly labelled illustrative — this is the method applied to a
 * made-up response set, never survey data.
 */
export function ScoreExplainer() {
  const [q14, setQ14] = useState<number[]>(Q14_STATEMENTS.map(() => 4));
  const [q15, setQ15] = useState<number>(4);
  const result = useMemo(() => computeScores(q14, q15), [q14, q15]);

  const selStyle: React.CSSProperties = {
    background: "rgba(8,29,40,0.8)",
    color: "var(--gani-cream)",
    border: "1px solid rgba(67,220,193,0.25)",
    borderRadius: 8,
    font: "600 11.5px var(--gani-font-ui)",
    padding: "5px 6px",
    maxWidth: 196,
  };

  return (
    <section className="prose-block glass" aria-label="Try the scoring method">
      <h3>Try the scoring method yourself</h3>
      <p style={{ margin: "2px 0 12px" }}>
        Answer as one hypothetical respondent and watch the proposed method turn ten answers
        into four theme scores and one overall score. <b>Illustrative only</b> — this applies
        the published scoring to your choices; it is not survey data.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.25fr) minmax(0, 1fr)", gap: 22, alignItems: "start" }}>
        <div>
          {Q14_STATEMENTS.map((st, i) => (
            <div key={st.text} style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 0", borderBottom: "1px solid rgba(242,244,233,0.06)" }}>
              <span className="dot" style={{ width: 8, height: 8, borderRadius: "50%", flex: "none", background: themeSeries[st.theme] }} />
              <span style={{ flex: 1, fontSize: 12, color: "var(--gani-ink-2)" }}>
                My local greenspaces {st.text}
              </span>
              <select
                style={selStyle}
                aria-label={`Response for: my local greenspaces ${st.text}`}
                value={q14[i]}
                onChange={(e) => {
                  const next = [...q14];
                  next[i] = Number(e.target.value);
                  setQ14(next);
                }}
              >
                {Q14_SCALE.map((o) => (
                  <option key={o.label} value={o.points}>
                    {o.label} ({o.points})
                  </option>
                ))}
              </select>
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0" }}>
            <span className="dot" style={{ width: 8, height: 8, borderRadius: "50%", flex: "none", background: themeSeries.access_to }} />
            <span style={{ flex: 1, fontSize: 12, color: "var(--gani-ink-2)" }}>
              Walk time to my nearest greenspace
            </span>
            <select
              style={selStyle}
              aria-label="Walk time to nearest greenspace"
              value={q15}
              onChange={(e) => setQ15(Number(e.target.value))}
            >
              {Q15_SCALE.map((o) => (
                <option key={o.label} value={o.points}>
                  {o.label} ({o.points})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          {(Object.keys(result.themes) as ThemeId[]).map((t) => (
            <div key={t} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, marginBottom: 3 }}>
                <span style={{ color: "var(--gani-ink-2)", fontWeight: 600 }}>
                  {THEME_SHORT[t]}{" "}
                  <span style={{ color: "var(--gani-ink-3)", fontWeight: 500 }}>
                    {result.points[t]}/{result.max[t]} pts
                  </span>
                </span>
                <span style={{ color: themeSeries[t], fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                  {result.themes[t]}%
                </span>
              </div>
              <div style={{ height: 7, borderRadius: 4, background: "rgba(8,29,40,0.8)" }}>
                <div
                  style={{
                    width: `${result.themes[t]}%`,
                    height: "100%",
                    borderRadius: 4,
                    background: themeSeries[t],
                    transition: "width 250ms ease",
                  }}
                />
              </div>
            </div>
          ))}
          <div style={{ marginTop: 16, padding: "14px 16px", borderRadius: 12, background: "rgba(6,72,61,0.45)", border: "1px solid rgba(67,220,193,0.25)" }}>
            <div style={{ fontSize: 11, color: "var(--gani-ink-3)", fontWeight: 700, letterSpacing: "0.08em" }}>
              OVERALL — AVERAGE OF THE FOUR THEMES
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <span style={{ font: "560 34px var(--gani-font-display)", color: "var(--gani-turquoise)" }}>
                {result.overall}%
              </span>
              <span style={{ fontSize: 11.5, color: "var(--gani-ink-3)" }}>
                NI average: {ni.totalPct}% of maximum
              </span>
            </div>
          </div>
          <p className="legend-note">
            Equal weights throughout: each input counts equally within its theme, and each
            theme contributes a quarter of the overall score.
          </p>
        </div>
      </div>
    </section>
  );
}
