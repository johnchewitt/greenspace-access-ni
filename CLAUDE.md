# CLAUDE.md — Greenspace Access NI

Instructions for AI-assisted development sessions on this repository. Read PROJECT_BRIEF.md
first; ARCHITECTURE.md governs structure; GREESPACE_METHODOLOGY.md governs every number.

## Project identity

- App name: **Greenspace Access NI** — subtitle *Understanding Access, Quality & Wellbeing
  Across Northern Ireland*. Use consistently in UI, `<title>`, navigation, README, exports
  and deploy config. Client: Outscape. Companion to the existing Greenspace NI Map.
- Design language: premium forest-green / emerald / turquoise / warm-gold. Tokens live in
  `src/config/branding.ts` — never hard-code colours in components.

## Data integrity (highest priority)

1. **`data/` is canonical and read-only by hand.** It is generated solely by
   `scripts/extract_data.py` from the source report. To change data, change the script and
   rerun it. (The source report is not in the repo, so CI cannot regenerate data/;
   instead the data-contract tests assert the key published values on every build.)
2. **Never invent, estimate, extrapolate or "fix" survey values.** Published % and index
   series are both kept as published even where they disagree slightly (see
   DATA_EXTRACTION_VERIFICATION.md §3); never recompute one from the other.
3. **Statistical integrity rules** (GREESPACE_METHODOLOGY.md §6) bind every surface:
   perception ≠ provision; interim/proposed labelling; n ≥ 30 only; sample sizes + margins
   of error surfaced; no implied significance of small differences; no unlabelled derived
   deciles.
4. **Components take numbers only from the data facade** (`src/data`), never from JSON
   imports or literals. New views must accept the integrity components
   (`SampleSizeBadge`, `UncertaintyNote`, `PerceptionLabel`, `InterimBanner`) where area
   values are shown.

## GIS rules

- Service URLs/item IDs live **only** in `src/config/services.ts`, each with the comment
  `verified: 2026-11-04` (or a newer verification date). Adding a service requires a live
  query first — no guessed URLs, layers or joins.
- LGD join: report name → ONS `N09…` code map in config, covered by a test that asserts
  exactly 11 matches.
- Mirror existing Greenspace NI Map filters (greenspace `ShowOnMap='Yes'`; trails
  `Infrastructure='False'`; access points `ShowOnMap='Yes' AND Area_Ha>=2`).
- No NI postcode polygons exist under open licence — do not draw approximate postcode
  boundaries; postcode results are chart-first (DATA_SOURCES.md §3).
- Perception vs Provision mode: councils + NI only; separated panels; never a combined
  score or correlation claim.

## Stack conventions

- React 19 + TypeScript strict; Vite; ArcGIS Maps SDK for JS **5.1** via
  `@arcgis/map-components` (no `esri-loader`); Calcite components for UI; ECharts for
  charts (shared theme from branding tokens).
- Module layout per ARCHITECTURE.md §2. Feature logic in selectors/hooks; map and chart
  modules are presentation-only.
- Tests: Vitest; data-contract tests are mandatory for any change touching `data/` or the
  facade. Build must pass `tsc --noEmit`, ESLint, tests.
- Deploy: GitHub Pages via Actions; Vite `base` must match the repo path; keep the
  data-drift CI check green.

## Attribution & licensing

Footer/About and any export must carry the attribution block in DATA_SOURCES.md §6
(Outscape/ORNI OGL v3 + Crown copyright NIMA MOU577.2; 56 Degree Insight/POMNI; ONS; Esri).
Licence year (2024 vs 2026) is unconfirmed — keep the `TBC` marker until Outscape confirms.
Use official Outscape brand assets only where approval is recorded.

## Process

- Stages per ROADMAP.md. **Do not start a later stage without instruction.**
- Before claiming a stage complete: re-verify on-screen numbers against `data/`, run the
  full check suite, and view the built app (not just the dev server).
- Open questions for the client are tracked in ROADMAP.md "Open items" — add there rather
  than resolving by assumption.
