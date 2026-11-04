# Stage 2 — Test & Verification Report

Date: 4 Nov 2026 · Build: `app/` production build (Vite 7, SDK 5.1.27, React 19)

All checks below were **actually executed** in the development environment. Remote
ArcGIS endpoints are blocked from this environment's shell/browser, so live-service
behaviour was verified two ways: (1) the endpoints, schemas and record counts were
verified by live REST queries during Stage 1 (see EXISTING_GIS_SERVICES.md), and
(2) the app's offline fallback path was exercised end-to-end here — which is the
spec §12 resilience requirement. Items needing a quick online confirmation before the
demo are flagged ⚠ with exact steps.

## Section 13 checklist

| # | Check | Result |
|---|---|---|
| 1 | Five national results (77 / 65 / 81 / 80 / 83%) | ✅ Asserted exactly in `tests/data-contract.test.ts`; verified on-screen (KPI cards, theme panel, Understand) |
| 2 | 11 council figures vs extracted source data | ✅ Data-contract tests: 11 N09 codes, Belfast 79.65%/103.374/AT 109, F&O 73.23%/AT 84, theme-index→total reconciliation for all 11 |
| 3 | Council boundaries & joins | ✅ Boundary GeoJSON carries the same values as the data facade (per-feature test); 11/11 codes join; map click → correct profile |
| 4 | Theme selection updates the map | ✅ Screenshot-verified: Access To selection re-renders choropleth + auto-switches to index format with explanation |
| 5 | % vs index interpreted correctly | ✅ Separate selectors; theme-by-council % views are not published, so the UI moves to index with an explanatory hint (never derives values); diverging map verified class-by-class against published values (amber <96 … turquoise ≥102–104) |
| 6 | Council selection & navigation | ✅ Click and search both select; smooth zoom (reduced-motion respected), gold highlight, others dimmed |
| 7 | Charts and panels stay synchronised | ✅ KPI cards ↔ map theme; Compare bar click → selection → radar/table/map all update |
| 8 | Outscape GIS services availability recorded | ✅ Per-layer status chips (loading/live/offline) in layer panel and PvP "Mapped evidence"; Stage 1 live verification: greenspace 1,493 features, trails 1,385, access points, bluespace, Council Analysis 2025. ⚠ Online smoke test before demo: toggle each layer on, expect "live" chips and visible features |
| 9 | Licensing & attribution | ✅ Persistent attribution chip + full credits modal (OGL v3, Crown copyright NIMA MOU577.2, 56DI/POMNI, OSNI, OSM/Esri); Esri view attribution retained |
| 10 | Presentation-scale layout & responsiveness | ✅ QA at 1600×950; tablet breakpoints at 1100/900px; panels collapsible |
| 11 | TypeScript checks | ✅ `tsc --noEmit` clean (strict) |
| 12 | Automated tests | ✅ `vitest run` — 7/7 passing |
| 13 | Production build | ✅ `vite build` clean; preview served and driven headlessly through all four modes |
| 14 | Critical errors & regressions | ✅ Only expected offline service errors in console; zero application errors across the scripted demo flow |

## Defects found and fixed during QA

- Right-hand PvP map had zero height (host wrapper broke grid stretch) — fixed.
- Index-axis bars for Mid Ulster (88) and Fermanagh & Omagh (84) fell below a fixed
  axis minimum in Compare — axis bounds now derive from the data.
- SDK polygon labels didn't render (GeoJSONLayer labelling quirk in 5.1) — replaced
  with an HTML overlay projected via `view.toScreen` (also typographically consistent).
- Map-sync raced the second map's initialisation — now viewpoint-based and gated on
  both views ready.
- Council-boundary asset regenerated at higher detail after close-zoom faceting.
- NI-average markline labels clipped at chart tops; radar clipped at panel edge — fixed.

## Known behaviours (by design)

- Theme × % by council is not published → the format toggle disables % for themes with
  an explanatory hint (integrity rule: no derived values).
- With every external service down, the app still delivers the full index experience
  (bundled boundaries, data, SDK assets, fonts); provision panel explains what's
  unavailable. Demo venues with internet get basemap + live layers automatically.
- Decile values are not published, so no decile view is shown (explained in Understand).

## ⚠ Pre-demo smoke test (5 minutes, on an online machine)

1. Open the deployed URL → Explore renders with KPI cards and labelled choropleth.
2. Toggle each Greenspace NI Map layer → status chips read "live", features draw.
3. Search "Belfast" → profile opens, map zooms.
4. Perception vs Provision → right map shows OSM basemap + greenspace/trails/access
   points; provision panel shows household-proximity figures for Belfast (400 m / 1 km / 2 km).
5. Understand + Compare → charts render; methodology modal opens.
