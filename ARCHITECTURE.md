# ARCHITECTURE.md — Greenspace Access NI

## 1. Stack

| Concern | Choice | Notes |
|---|---|---|
| Framework | React 18 + TypeScript (strict) | Functional components, hooks |
| Build | Vite | `base` set for GitHub Pages project path |
| Mapping | **ArcGIS Maps SDK for JavaScript 5.1** via **map components** (`@arcgis/map-components`: `arcgis-map`, `arcgis-legend`, `arcgis-expand`, …) | Web components wrapped in thin React adapters; no legacy `esri-loader` |
| UI | **Calcite Design System** (`@esri/calcite-components`) | Shell, panels, tabs, sliders, chips |
| Charts | **ECharts** (`echarts` + thin React wrapper) | Bar/column, radar for theme profiles, custom tooltips |
| State | React context + reducers (no Redux) | Small, serialisable UI state |
| Hosting | GitHub Pages | Static; SPA-fallback 404.html; HashRouter (or 404 redirect pattern) |
| Testing | Vitest + React Testing Library | Data-contract tests against `data/*.json` |

All survey data ships as static JSON (`data/`) bundled at build time — no backend, no
database. Live GIS layers are consumed directly from the verified public services
(EXISTING_GIS_SERVICES.md); boundaries from ONS Open Geography (DATA_SOURCES.md).

## 2. Module layout

```
src/
  app/                    shell, routing (Explore | Understand | Compare), theme provider
  config/
    services.ts           ALL external service URLs + item IDs + layer filters (single source)
    branding.ts           palette tokens, app name/subtitle, attribution strings
  data/                   typed loaders + zod schemas validating data/*.json at build/test
    index.ts              GreenspaceIndexData facade (lgd, postcodeArea, postcodeSector,
                          classifications, surveyInputs, methodology, metadata)
  features/
    explore/              map view, geography switcher, theme/format switchers, area panel
    understand/           index explainer, survey questions, demographic findings, caveats
    compare/              comparison builders, rankings, theme profiles, perception-vs-provision
  map/
    layers/               FeatureLayer factories (boundaries join, greenspace, trails,
                          access points, bluespace, provision layers)
    renderers/            class-breaks + per-format symbology, popup templates
    hooks/                useMapView, useLayerVisibility, useHighlight
  charts/                 ECharts option builders (themed), chart React wrapper
  components/             shared UI (StatCallout, SampleSizeBadge, UncertaintyNote,
                          FormatToggle, AttributionFooter)
  utils/                  formatting, decile derivation (labelled "derived"), a11y helpers
```

Design rules:
- **`config/services.ts` is the only place a URL lives.** Future swaps (Analysis2026
  vintage, licensed postcode polygons, MOVE NI services) are config changes.
- **Data facade owns the numbers.** Components never import JSON directly; the facade
  exposes typed accessors plus the integrity metadata (sample sizes, MoE, format labels)
  so no view can show a value without its caveats being available.
- **Map and charts are presentation-only.** They receive prepared view-models; all
  joins/format selection happen in feature-level selectors (unit-testable).

## 3. Geographic strategy

| Geography | Perception data | Geometry | Rendering |
|---|---|---|---|
| NI overall | ✔ (77% + themes) | — | Stat callouts, charts |
| Local authority (11) | ✔ (% / index / themes) | ONS Open Geography LAD (BGC) FeatureServer, filter `N09%` — live-verified | **Choropleth** (join on `N09…` code via report-name→code map in `config`) |
| Postcode area (48) | ✔ (+ n) | ✖ no open NI polygons (BT carve-out from OGL) | **Non-choropleth**: ranked/interactive charts, labelled proportional symbols at centroid points *only if* a licensed/approvable source is confirmed; otherwise chart-first with map highlights of related councils |
| Postcode sector (23) | ✔ (+ n) | ✖ as above | As postcode area |
| SDZ / SOA / settlement | ✖ (no perception data) | Outscape services | Provision context only (COMPARE) |

The client-side join (LAD code → index record) is validated by a build-time test: all 11
codes must match exactly, no fallbacks.

## 4. The three experiences

### EXPLORE
- `arcgis-map` with NI extent lock; geography switcher (LGD | postcode area | postcode
  sector), theme switcher (Total | Access To | Access Within | Quality | Benefits), format
  toggle (% of max | Index NI=100 | Decile view, labelled "derived ranking of published
  values").
- LGD choropleth with diverging symbology centred at 100 for index format and sequential
  for % format; legend from the SDK.
- Area click → Calcite panel: total + four themes (bar/radar), sample-size badge (postcode
  geographies), MoE note, "perception data" label.
- Context layer toggles (default off): greenspace polygons, trails, access points,
  bluespace (marked "early-stage dataset"), environmental designations — straight from
  Outscape services with their existing filters.

### UNDERSTAND
- Narrative, scroll- or tab-driven: what the index is → the two survey questions (with the
  real NI response distributions as interactive charts) → how scoring works (worked
  example from the report's scoring table) → the four themes → formats explained →
  demographic findings (IMD, urban/rural, age, sex, visit frequency) → validity evidence
  (visit-frequency gradient) → limitations (threshold, MoE, perception vs provision,
  interim status).
- Every figure sourced from `data/` — no hand-typed numbers in components.

### COMPARE
- **Geography compare:** select 2–3 areas (same geography level only) → side-by-side theme
  profiles (radar/column) vs NI baseline; reproduces the report's BT20/BT82 example.
- **Demographic compare:** classification group charts (% and index formats).
- **Rankings:** the four published top-ten tables; postcode-level full lists presented as
  banded/decile views with explicit anti-league-table framing (ties and MoE noted).
- **Perception vs Provision (future-facing mode):** select a council → perception panel
  (index themes) beside provision panel (`Percent400/1km/2km` households near greenspace
  from `GreenspaceNI_Council_Analysis2025`, greenspace ha, trail length). Strict rules:
  only geographies with compatible source data (11 councils + NI overall); panels visually
  separated with explicit "survey perception" vs "measured provision" labels; **no
  combined score, no correlation claims, no equating of the two**; divergence framed as
  "areas where perception and provision tell different stories — a prompt for further
  investigation".

## 5. Cross-cutting

- **Integrity components:** `SampleSizeBadge`, `UncertaintyNote`, `PerceptionLabel` and
  `InterimBanner` are required props of any surface showing area-level values (enforced by
  component API, not convention).
- **Branding:** palette tokens (forest-green primary, emerald/turquoise supporting,
  warm-gold accent) defined once in `branding.ts` + CSS variables; Calcite theming via
  `--calcite-*` overrides; ECharts theme generated from the same tokens; "Greenspace
  Access NI — Understanding Access, Quality & Wellbeing Across Northern Ireland" in
  `<title>`, shell header, README, manifest and deploy config.
- **Attribution:** persistent footer + About panel: Outscape/ORNI (GreenspaceNI layers,
  OGL v3, "© Crown copyright and database right (year) NIMA MOU577.2"), 56 Degree
  Insight/POMNI (index), ONS Open Geography (boundaries, OGL v3), Esri basemap credits
  (automatic). Official Outscape brand assets only where approved.
- **Accessibility:** colour ramps colour-blind safe and value-redundant (labels/patterns);
  keyboard navigation across map and panels; WCAG AA contrast within the premium palette.
- **Performance:** lazy-load experiences by route; LGD layer is 11 features (trivial);
  context layers load on toggle only; static JSON ≤ ~100 KB total.
- **Extensibility hooks (per brief):** `config/services.ts` reserves slots for future
  Outscape greenspace layers and **MOVE NI accessibility analysis**; the provision panel
  reads a declarative indicator list so new published indicators appear without component
  changes.

## 6. Build & deploy

GitHub Actions: lint → typecheck → test (incl. data-contract tests) → `vite build` →
Pages deploy. The data pipeline (`scripts/extract_data.py`) runs offline, committed with
its outputs; CI re-runs it and fails on any diff against committed `data/` (prevents
silent data drift).
