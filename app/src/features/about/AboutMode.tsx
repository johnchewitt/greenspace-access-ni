import { APP_NAME, APP_SUBTITLE } from "../../config/branding";
import { integrity } from "../../data";
import { useAppDispatch } from "../../state/AppState";

export function AboutMode() {
  const dispatch = useAppDispatch();
  return (
    <div className="overlay-stage" role="region" aria-label="About and methodology">
      <div className="overlay-inner about-inner">
        <p className="section-label">About &amp; methodology</p>
        <h1 className="overlay-hero">{APP_NAME}</h1>
        <p className="overlay-lede">{APP_SUBTITLE}</p>

        <section className="prose-block glass">
          <h3>Purpose</h3>
          <p>
            {APP_NAME} brings two kinds of evidence about Northern Ireland's greenspace into
            one place: what is physically there (the mapped estate Outscape already
            publishes through the Greenspace NI Map) and how residents experience it (the
            proposed survey-based Greenspace Standards Index). It is built to support
            greenspace policy, planning and investment conversations — as a companion to the{" "}
            Greenspace NI Map, not a replacement for it.
          </p>
          <h3>The Greenspace Standards Index project</h3>
          <p>
            The index is a <b>proposed methodology</b> developed by 56 Degree Insight for
            Outscape from the People in the Outdoors Monitor NI (POMNI 2025, 4,000
            respondents). Survey questions about local greenspaces are converted into four
            equally weighted themes — Accessibility To Greenspace, Accessibility Within,
            Quality, and Benefits — and averaged into one score, reported as a percentage of
            the maximum possible and as an index against the NI average (100). Results here
            are from the <b>interim report (v2, July 2026)</b> and are subject to
            refinement. {integrity.status}.
          </p>
        </section>

        <section className="prose-block glass">
          <h3>Data sources</h3>
          <ul>
            <li>
              <b>Perception:</b> POMNI 2025 survey results as published in the interim
              report — national, council and postcode geographies. {integrity.threshold};{" "}
              {integrity.moe}. Council-level sample sizes are not published in the interim
              report.
            </li>
            <li>
              <b>Provision:</b> Outscape / Outdoor Recreation NI's public Greenspace NI Map
              services — greenspace sites (publicly accessible, ≥ 0.5 ha), off-road trails,
              access points, and the household walking-access analysis at council, Super
              Data Zone and NI level. These services are queried <b>live</b>; nothing is
              copied or re-hosted, and figures reflect the services at view time.
            </li>
            <li>
              <b>Boundaries &amp; reference geography:</b> council boundaries derived from OSNI Open
              Data; settlement development limits from the published statutory Area Plans
              (NI Planning open data). Postcode <b>district</b> boundaries
              are a client-supplied boundary dataset; postcode <b>sector</b> boundaries
              are <b>derived</b> within those districts — a Voronoi tessellation of
              ~43,000 licence-cleared NSPL unit-postcode locations (Nov 2020), clipped
              per district and dissolved by sector — and are indicative rather than
              official. The derivation method is stated here precisely so the
              distinction stays visible.
            </li>
          </ul>
          <h3>What the walking thresholds mean</h3>
          <p>
            The published analysis measures the share of <b>households</b> within 400 m,
            1 km and 2 km of mapped greenspace or trails, using network analysis from access
            points where available. The 400 m threshold relates to the Programme for
            Government "5-minute walk to quality greenspace" ambition — shown here as
            context, without constituting a formal compliance assessment. This application
            performs no walking-time analysis of its own and never approximates access with
            circular buffers.
          </p>
        </section>

        <section className="prose-block glass">
          <h3>Perception is not provision</h3>
          <p>
            Survey scores measure how greenspace <i>feels</i> to the people who answered;
            the map measures what is <i>there</i>. The two use different methods, different
            geographies and different definitions, so this application keeps them visibly
            separate, never combines them into a single score, and treats divergence between
            them as a prompt for further investigation — never as a proven gap or a causal
            claim.
          </p>
          <h3>Limitations</h3>
          <ul>
            <li>{integrity.basis}.</li>
            <li>{integrity.significance}.</li>
            <li>
              Perception and provision geographies differ (postcodes vs statistical areas);
              comparisons are made only where geography is compatible — council level and NI
              overall.
            </li>
            <li>
              Mapped coverage reflects what has been mapped: informal or private access is
              not captured, which matters most in rural areas.
            </li>
            <li>
              The index's % and index-score series are both published values; where they
              disagree slightly they are shown as published, never recomputed.
            </li>
          </ul>
          <h3>Data currency</h3>
          <p>
            The Greenspace NI Map is maintained by Outscape on an annual update cycle;
            provision analysis figures in this application are labelled with their analysis
            vintage wherever shown. Survey results are the 2025 wave, as published in the
            interim report.
          </p>
        </section>

        <section className="prose-block glass">
          <h3>Attribution</h3>
          <p style={{ fontSize: 12.5 }}>
            Greenspace Standards Index: 56 Degree Insight analysis of POMNI 2025 (interim,
            proposed methodology) for Outscape. Greenspace, trails, access points &amp;
            provision analysis: GreenspaceNI Map, Outdoor Recreation NI / Outscape, funded
            by DAERA &amp; DfI — contains public sector information licensed under the Open
            Government Licence v3.0; © Crown copyright and database right Land &amp;
            Property Services, NIMA MOU577.2. Council boundaries derived from OSNI Open
            Data (OGL v3). Basemap © OpenStreetMap contributors, © Esri. Built with the
            ArcGIS Maps SDK for JavaScript.
          </p>
          <p className="legend-note">
            This application presents published material and live public services; it does
            not imply endorsement by Outscape's funders or data providers. Source data,
            derived indicators and interpretations are labelled as such throughout.
          </p>
          <div className="hero-cta" style={{ marginTop: 10 }}>
            <button onClick={() => dispatch({ type: "methodology", open: true })}>
              Scoring method in detail
            </button>
            <button onClick={() => dispatch({ type: "tour", step: 0 })}>Take the tour</button>
            <button className="primary" onClick={() => dispatch({ type: "mode", mode: "overview" })}>
              Back to overview →
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
