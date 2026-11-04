import { useMemo } from "react";
import {
  THEME_ORDER,
  THEME_LABELS,
  fmtPct,
  integrity,
  methodology,
  ni,
  surveyInputs,
} from "../../data";
import { themeSeries } from "../../config/branding";
import { Chart } from "../../charts/Chart";
import { ScoreExplainer } from "./ScoreExplainer";
import {
  classificationGroups,
  groupIndexOption,
  q14Option,
  q15Option,
  visitFrequencyOption,
} from "../../charts/options";

interface ThemeDef {
  id: string;
  name: string;
  inputs: string[];
  max_points: number;
}

const THEME_BLURBS: Record<string, string> = {
  access_to:
    "Can people get to greenspace at all? Combines whether local greenspaces are easy to reach without a car with how long the walk is to the nearest one.",
  access_within:
    "Once there, is it for everyone? Whether local greenspaces feel safe and welcoming, and inclusive for people of all abilities.",
  quality:
    "Is it a good greenspace? Navigation and signage, amenities such as seating, bins or toilets, how well cared for sites feel, and richness in nature and wildlife.",
  benefits:
    "Does it improve lives? Perceived benefits to mental health and physical activity, and to community and place.",
};

export function UnderstandOverlay() {
  const themes = (methodology as { themes: ThemeDef[] }).themes;
  const q14 = useMemo(() => q14Option(), []);
  const q15 = useMemo(() => q15Option(), []);
  const visits = useMemo(() => visitFrequencyOption(), []);
  const q14Scoring = (surveyInputs as { q14: { scoring: Record<string, number> } }).q14.scoring;
  const q15Scoring = (surveyInputs as { q15: { scoring: Record<string, number> } }).q15.scoring;

  return (
    <div className="overlay-stage" role="region" aria-label="Understand the index">
      <div className="overlay-inner">
        <p className="section-label">Understand · the proposed index</p>
        <h1 className="overlay-hero">
          Four thousand residents, ten questions, one picture of how Northern Ireland
          experiences its greenspaces
        </h1>
        <p className="overlay-lede">
          The proposed Greenspace Standards Index turns the People in the Outdoors Monitor
          for Northern Ireland (POMNI 2025) into a consistent, evidence-based measure of how
          residents perceive the accessibility, quality and benefits of their local
          greenspaces — a perception layer designed to sit alongside the objective
          provision mapping in the Greenspace NI Map. It is an interim, proposed
          methodology shared for feedback, not an adopted statutory standard.
        </p>

        <div className="card-grid">
          {themes.map((t) => (
            <section
              key={t.id}
              className="theme-card glass"
              style={{ "--tc": themeSeries[t.id as keyof typeof themeSeries] } as React.CSSProperties}
            >
              <div className="pct">{fmtPct(ni.themesPct[t.id as keyof typeof ni.themesPct])}</div>
              <h3>{t.name}</h3>
              <p>{THEME_BLURBS[t.id]}</p>
              <ul>
                {t.inputs.map((i) => (
                  <li key={i}>{i.replace("Q14: ", "Q14 · ").replace("Q15: ", "Q15 · ")}</li>
                ))}
              </ul>
              <p className="max">
                Scored out of {t.max_points} points · contributes ¼ of the overall index
              </p>
            </section>
          ))}
        </div>

        <section className="prose-block glass">
          <h3>From answers to a score</h3>
          <p>
            Each response converts to points — then each theme is expressed as a percentage
            of its maximum, and the four theme percentages are averaged with{" "}
            <b>equal weights</b> into the overall score. Equal weighting was agreed with the
            project steering group: transparent, replicable for future POMNI waves, and free
            of subjective judgement.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            <table aria-label="Q14 scoring">
              <thead><tr><th>Q14 — agreement</th><th style={{ textAlign: "right" }}>Points</th></tr></thead>
              <tbody>
                {Object.entries(q14Scoring).map(([k, v]) => (
                  <tr key={k}><td>{k}</td><td className="num" style={{ textAlign: "right" }}>{v}</td></tr>
                ))}
              </tbody>
            </table>
            <table aria-label="Q15 scoring">
              <thead><tr><th>Q15 — walk to nearest greenspace</th><th style={{ textAlign: "right" }}>Points</th></tr></thead>
              <tbody>
                {Object.entries(q15Scoring).map(([k, v]) => (
                  <tr key={k}><td>{k}</td><td className="num" style={{ textAlign: "right" }}>{v}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <ScoreExplainer />

        <section className="prose-block glass">
          <h3>What residents actually said</h3>
          <p>
            Agreement is strong on benefits, care and safety — weakest on car-free access
            and facilities. Each bar is one Q14 statement, Northern Ireland level.
          </p>
          <Chart option={q14} className="chart-box tall" ariaLabel="Stacked bar chart of agreement with each Q14 greenspace statement" />
          <p style={{ marginTop: 18 }}>
            And the walk to the nearest greenspace (Q15): most people are within 20 minutes,
            but one in five say more than 30 minutes.
          </p>
          <Chart option={q15} className="chart-box" ariaLabel="Bar chart of walking time to nearest greenspace" />
        </section>

        <section className="prose-block glass">
          <h3>Three ways to read a score</h3>
          <table>
            <thead><tr><th>Format</th><th>Meaning</th><th>Use it for</th></tr></thead>
            <tbody>
              <tr>
                <td><b>% of maximum</b></td>
                <td>Absolute performance; 100% = highest possible. NI overall: {fmtPct(ni.totalPct)}.</td>
                <td>How positive perceptions are overall</td>
              </tr>
              <tr>
                <td><b>Index (NI = 100)</b></td>
                <td>Relative to the NI average; 110 ≈ 10% above average.</td>
                <td>Comparing places and groups</td>
              </tr>
              <tr>
                <td><b>Deciles</b></td>
                <td>Areas ranked into ten equal groups — proposed for mapping; no decile values are published in the interim report.</td>
                <td>Future mapping, once methodology is confirmed</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="prose-block glass">
          <h3>Who scores higher, who lower</h3>
          <p>
            Index against the NI average (100). Urban residents and the least deprived areas
            perceive better access <i>to</i> greenspace; quality and benefits are far more
            uniform.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
            <div>
              <p className="section-label" style={{ margin: "10px 0 0" }}>Deprivation (NIMDM extremes)</p>
              <Chart option={groupIndexOption(classificationGroups("deprivation"), themeSeries.total)} className="chart-box" ariaLabel="Index by deprivation decile extremes" />
            </div>
            <div>
              <p className="section-label" style={{ margin: "10px 0 0" }}>Urban / rural</p>
              <Chart option={groupIndexOption(classificationGroups("urban_rural"), themeSeries.access_to)} className="chart-box" ariaLabel="Index by urban rural classification" />
            </div>
            <div>
              <p className="section-label" style={{ margin: "10px 0 0" }}>Age group</p>
              <Chart option={groupIndexOption(classificationGroups("age"), themeSeries.quality)} className="chart-box" ariaLabel="Index by age group" />
            </div>
            <div>
              <p className="section-label" style={{ margin: "10px 0 0" }}>Sex</p>
              <Chart option={groupIndexOption(classificationGroups("sex"), themeSeries.benefits)} className="chart-box" ariaLabel="Index by sex" />
            </div>
          </div>
        </section>

        <section className="prose-block glass">
          <h3>Why the results look credible</h3>
          <p>
            People who visit greenspace most score it highest — exactly the gradient you
            would expect if the index is measuring something real about local greenspace
            experience.
          </p>
          <Chart option={visits} className="chart-box" ariaLabel="Overall score by frequency of greenspace visits" />
        </section>

        <section className="prose-block glass" style={{ border: "1px solid rgba(226,183,107,0.3)" }}>
          <h3>Read before quoting</h3>
          <ul>
            <li>{integrity.source}.</li>
            <li>{integrity.basis}.</li>
            <li>{integrity.survey}; {integrity.threshold.toLowerCase()}; {integrity.moe.toLowerCase()}.</li>
            <li>{integrity.significance}.</li>
            <li>No survey microdata is exposed by this application — published aggregates only.</li>
          </ul>
        </section>
        <p className="legend-note" style={{ marginTop: 14 }}>
          Themes in full: {THEME_ORDER.map((t) => THEME_LABELS[t]).join(" · ")}
        </p>
      </div>
    </div>
  );
}
