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

## Stage 4 — Executive experience, reporting, QA & deployment ✅ (delivered 5 Nov 2026)

Built against the client's Stage 4 brief (A–J):

- **Overview landing + executive dashboard** (new default view): "Better Greenspace.
  Better Places. Better Lives." hero over the live map backdrop, count-up headline
  indicators (published survey values + live service figures, reduced-motion aware),
  evidence-at-a-glance summary for decision-makers with links into every detailed view,
  section entry cards, and a Create-report entry point.
- **Eight-section navigation**: Overview · Explore · Standards · Accessibility ·
  Insights · Perception vs Provision · Story · About — map state preserved across
  sections (single mounted map); Compare lives on as the Insights "Comparisons" tab;
  short nav labels at narrow widths.
- **Accessibility explorer** (new mode): the published SDZ household-proximity surface on
  the main map with 400 m / 1 km / 2 km switching, legend, NI reference figures, context
  layers, plain-language help ("what is a Super Data Zone"), and the explicit
  no-isochrone / no-circular-buffer statement.
- **Opportunity explorer** (Insights tab): transparent council screening on published
  indicators only (Access To index vs NI; 400 m provision vs the NI figure;
  perception-lags-provision divergence) with every indicator value shown and no invented
  composite score, plus the twelve lowest-coverage SDZs queried live (SDZ_Name/SDZ_Code
  verified on the service) with zoom-to-SDZ map links. Framed throughout as starting
  points, never approved priorities.
- **PDF report generation**: branded A4-landscape evidence summary for the current
  selection (council or NI) — KPIs, live map snapshot (view.takeScreenshot), quadrant
  position with caveat, standards context, full attribution — via print-to-PDF with a
  dedicated print stylesheet; unavailable items are omitted with a stated reason.
- **About & Methodology section**: purpose, project context, sources, role of Outscape's
  services, threshold meanings, perception≠provision, limitations, data currency,
  attribution (no implied endorsement).
- **UX**: first-visit guided tour (5 steps, localStorage-guarded, relaunchable from the
  header and About), reset-view map control, tooltips, offline notes everywhere a live
  query can fail, responsive pass (desktop/tablet/mobile; nav scroll + grid minmax fix
  for a real 390 px overflow found in QA).
- **Deployment prep**: README (stack, integrity rules, build/deploy instructions, no env
  vars/keys needed, attribution incl. licence-year TBC) and DEMO_SCRIPT.md (12-minute
  walkthrough with caveats and client questions).
- Quality gate: 44 tests (8 new Stage-4 tests incl. opportunity screening against
  live-verified values and degraded-mode behaviour), tsc, eslint, build, headless QA of
  all eight sections at 1600/768/390 px — zero page errors.
- Stage 4 fixes found in QA: insights tab bar unclickable under the overlay (z-index),
  report meta lines concatenating, mobile horizontal overflow (grid minmax).

Post-demo backlog (unchanged): MOVE NI, postcode boundaries decision, future POMNI
waves, decile mapping once methodology confirmed, official brand assets once approved.

## Stage 5 — Client datasets & refinements ✅ (delivered 5 Nov 2026)

Built from client-supplied datasets and feedback:

- **Postcode results on the map**: the supplied NI postcode dataset is geocoded unit
  postcode *points* (61,945 features; 42,796 precise unit-level matches), not polygons —
  so, honouring the no-approximate-boundaries rule, published POMNI results now render
  as **markers at postcode reference points** (median of each unit's member postcodes;
  all 48 districts + 23 sectors resolved, geography spot-checked, coverage asserted by
  tests). Explore gains a Geography switch (Councils / Districts / Sectors): markers use
  the same defined class bands as the choropleth, code labels, click-for-profile panels
  (place, %, index, theme indices, n badge, MoE note, bands framing), search-to-map for
  postcodes, and a ghosted council layer beneath for context. Reference points are built
  by `scripts/build_postcode_points.py` (source file not committed).
- **OSNI settlement footprints**: bundled context layer (1,088 polygons, classed by
  settlement size, 582 KiB). The source carries no name attribute, so the layer is
  honest footprint context without labels — labelling needs a named open dataset
  (flagged to the client).
- **2 km surface bug (client-reported)**: root cause found live — the 2026 SDZ vintage
  has no Percent2km values at all (0 of 849 rows; verified by REST query). Each
  threshold now pins the latest vintage that computed it (2 km → 2025, all 850 SDZs),
  vintages are never mixed in one surface, and the UI labels the switch explicitly.
- **Basemap switcher**: greyscale option added (None / Dark / Grey / OSM), all from the
  single verified keyless OSM source via layer effects.
- SDK 5.1.27 quirk logged: a client-side FeatureLayer `source` of points paints nothing
  (features present in the layer view, zero pixels) — postcode markers use a GeoJSONLayer
  over a Blob URL instead. (Headless-sandbox GL cannot rasterise marker sprites at all,
  so marker rendering is verified on the live site, not in headless QA.)
- Quality gate: 48 tests (coverage + bounding-box + state-transition + vintage-pinning
  additions), tsc, eslint, build, headless QA — green, zero page errors.

## Risks & dependencies

| Risk | Mitigation |
|---|---|
| Licence year/terms ambiguity (2024 vs 2026, blanket OGL) | Confirm with Outscape before public URL; demo can run with "year TBC" footnote internally |
| Postcode mapping expectation vs no open BT polygons | Decision point flagged now; chart-first design ready either way |
| % vs index baseline inconsistency in source | Both series shipped as published; raise with 56DI; UI never cross-computes |
| Analysis vintage change (2026 analysis lands) | Single-config service URLs |
| SDK 5.1 / Calcite version drift | Pin versions at scaffold; upgrade only between stages |
