# ROADMAP.md — Greenspace Access NI

Four-stage delivery toward an imminent client demonstration. **Stage 1 is complete; later
stages start only on instruction.** Stage contents below are proposed from the Stage-1
brief — confirm/adjust before Stage 2 kicks off.

## Stage 1 — Specification, data extraction & architecture ✅ (this delivery)

- Full analysis of the interim report; validated extraction of every published value to
  `data/` (14 JSON/CSV files + regeneration script + verification report).
- Verified geographic sources (ONS LAD boundaries live-tested; NI postcode polygon
  constraint documented) and the complete Greenspace NI Map service inventory with
  schemas, counts, sharing and licence findings.
- Specification docs: PROJECT_BRIEF, ARCHITECTURE, DATA_SOURCES, GREESPACE_METHODOLOGY,
  EXISTING_GIS_SERVICES, CLAUDE, this roadmap.
- Open items carried forward: licence-year confirmation (2024 vs 2026) and blanket reuse
  confirmation from Outscape; accompanying Excel (postcode theme %, deciles, LGD n) from
  56DI if wanted; MOVE NI endpoints; postcode boundary licensing decision.

## Stage 2 — The Greenspace Intelligence Explorer ✅ (delivered 4 Nov 2026)

Delivered beyond the original Stage 2 scope to meet the accelerated demo date — all four
experiences shipped in one stage:

- App shell (Vite + React 19 + TS strict, ArcGIS SDK 5.1 map components, Calcite,
  ECharts), full brand system, GitHub Pages deployment workflow.
- EXPLORE: labelled council choropleth (defined class breaks; % and index formats), five
  national KPI cards, council profiles with theme charts, Outscape layer toggles with
  live-status chips, custom legend, integrity chip/notes, local geographic search.
- UNDERSTAND: themes, scoring tables, real Q14/Q15 distributions, demographic findings,
  visit-frequency validity evidence, score formats, reliability caveats.
- COMPARE: ranked 11-council chart (click-to-select, map-synced), radar + theme table.
- PERCEPTION VS PROVISION (signature): split synchronised maps — perception index
  canvas beside mapped provision (greenspace/trails/access points/bluespace) with
  published Council Analysis 2025 household-proximity indicators and strict
  perception≠provision language; per-layer availability states.
- Resilience: boundaries, survey data, SDK assets and fonts all bundled — the core app
  works with every external service unreachable.
- Verification: STAGE2_VERIFICATION.md (section-13 checklist, all checks executed).

## Stage 3 — Depth round ✅ (delivered 4 Nov 2026, pre-demo at client request)

- COMPARE geography tabs: all 48 postcode areas and 23 sectors as chart-first views
  (no open-licence NI postcode boundaries exist) — bars coloured by the defined class
  bands, sample sizes and ±8–18pp MoE in tooltips, explicit bands-not-league-table
  framing.
- Theme leaders: the report's four published top-ten rankings reproduced exactly.
- UNDERSTAND: interactive "try the scoring method" explainer — the published method
  applied live to a hypothetical response set, labelled illustrative (methodology
  verified by unit tests; the report's own slide-6 example row is internally
  inconsistent and is noted rather than reproduced).
- PERCEPTION VS PROVISION: toggleable SDZ household-proximity surface (live-verified
  service; 3,399 rows = ~850 SDZs × 4 vintages, filtered to the 2026 vintage and
  labelled) with in-panel legend.
- Quality gate: 25 tests, lint, typecheck, build, headless QA — all green.
- Deferred to post-demo feedback: Outscape's vintage preference, postcode boundary
  licensing decision, SOA/settlement surfaces, any demo-driven changes.

## Stage 3 brief (client specification A–F) ✅ (delivered 5 Nov 2026)

Built against the client's Stage 3 brief; every indicator from validated data only.

- **A — Insights dashboard** (new INSIGHTS mode): live greenspace hectares and site
  counts queried from the verified ORNI layers (sum/count statistics, with explicit
  offline fallback notes); NI household-proximity KPIs at 400 m / 1 km / 2 km from the
  live-verified AllNI analysis layer, vintage-labelled; provision-by-council bar
  (click-through to the map); survey perception KPIs alongside, clearly separated;
  provenance note covering the household basis and the PfG 400 m ambition "without
  constituting a formal assessment". No fabricated statistics — every number is either
  a published survey value or a live query result, and failures degrade to a note.
- **B — Perception vs Provision completed**: side-by-side panels retained; new
  evidence drawer with a perception-index × 400 m-provision scatter (reference lines
  at NI values), a four-quadrant classification (High/Low perception × High/Low
  provision) with counts, click-to-emphasize on the map (FeatureFilter dim/highlight),
  and an interpretation panel that names divergent councils while stating the result
  is a prompt for further investigation — never a proven gap or causal claim.
  Provision reference uses the published NI value, falling back to the council median
  (labelled); classification returns null below 6 comparable councils. Threshold
  toggle (400 m / 1 km / 2 km) re-renders the SDZ surface.
- **C — Standards explorer**: UNDERSTAND theme cards with per-statement agreement
  bars, scoring method explainer, recommended-vs-compliance distinction, and the PfG
  400 m defined-threshold card linking each standard to the relevant map view.
- **D — Accessibility explorer**: threshold switching on the SDZ household surface
  with transparent communication that no live walking service-area (isochrone)
  analysis is available — no circular buffers, no claimed dynamic analysis.
- **E — Guided story**: six-chapter narrative (STORY mode) with map choreography via
  the app's single state writer — chapter 6 emphasizes the three lowest Access To
  councils (Fermanagh & Omagh 84, Mid Ulster 88, ACB&C 91) with a verified
  FeatureFilter highlight; council labels shown for orientation; keyboard navigation
  (←/→/Esc), progress dots, exit restores the explore state.
- **F — Two-area comparison**: COMPARE "Two councils" view — paired theme-index bars
  and an indicator table including live 400 m / 1 km provision rows (vintage-noted),
  with both areas linkable to the map.
- Design: topographic contour motif on overlay and story panels; palette validator
  re-run; no new runtime dependencies.
- Quality gate: 36 tests (incl. 9 new brief tests: quadrant classification verified
  against live 2026 provision values, median fallback, sparse-data null, caveat
  presence, NI vintage pinning, state transitions), lint, typecheck, build, headless
  QA of all six modes, pixel-verified chapter-6 emphasis — all green.

## Stage 4 — Polish, verification & demo delivery (proposed)

- Design polish pass (premium feel, motion, empty/loading states), accessibility audit
  (WCAG AA, keyboard, colour-vision), performance pass, cross-device QA.
- Independent fact-check of every on-screen number against `data/` and the source report;
  copy review of all caveat language.
- Report-export view (branded, attributed), README, demo script/walkthrough for the
  client session; stakeholder feedback loop and backlog for post-demo work (MOVE NI,
  postcode boundaries, future POMNI waves, decile mapping once methodology confirmed).

## Risks & dependencies

| Risk | Mitigation |
|---|---|
| Licence year/terms ambiguity (2024 vs 2026, blanket OGL) | Confirm with Outscape before public URL; demo can run with "year TBC" footnote internally |
| Postcode mapping expectation vs no open BT polygons | Decision point flagged now; chart-first design ready either way |
| % vs index baseline inconsistency in source | Both series shipped as published; raise with 56DI; UI never cross-computes |
| Analysis vintage change (2026 analysis lands) | Single-config service URLs |
| SDK 5.1 / Calcite version drift | Pin versions at scaffold; upgrade only between stages |
