# Stage 2 Review — findings and fixes

Post-deployment review (senior React / ArcGIS / UX / QA pass), 4 Nov 2026.
All fixes implemented, tested and deployed; nothing rebuilt, no new runtime dependencies.

## Issues found and fixed

| Severity | Area | Finding | Fix |
|---|---|---|---|
| **High (live bug)** | ArcGIS | Outscape context layers (greenspace, trails, points) were drawn **below** the opaque index choropleth, so toggling them in Explore showed nothing — reported live by the client; invisible to offline QA because the PvP map's transparent fills masked it | Draw order corrected: choropleth at bottom, context layers above, selection outline topmost. Verified programmatically (layer stack) and online post-deploy |
| **High (data integrity)** | Data | `GreenspaceNI_Council_Analysis2025` actually holds **44 rows — one per council per analysis year (2023, 2024, 2025, 2026)**, confirmed by live query. The PvP panel kept whichever row the server returned last — an arbitrary vintage | New `pickLatestProvision()` pins each council's most recent `Year_`, and the panel now labels the vintage (e.g. "2026 vintage"). Unit-tested |
| Medium | Data | Provision % formatter used a fragile `>1` unit heuristic | Live query confirmed values are already percentages (22.8–100); formatter simplified to published-value display. `LGDCode = N09…` also confirmed, with name-matching retained only as fallback |
| Medium | Code quality | **No ESLint gate existed** despite project conventions | ESLint flat config added (typescript-eslint + react-hooks incl. the React-compiler rules); 7 violations found and fixed (controller mutation in effects → explicit setter methods; `pvpOpened` setState-in-effect → reducer state; ref access during render → stable `dispatch` closures). `eslint .` now clean and runs in CI |
| Low | Code | Dead export (`useExploreData`), unused import | Removed |
| Doc | Docs | CLAUDE.md said React 18 and claimed a CI data-drift regeneration that can't exist without the source report in the repo | Corrected to React 19; CI contract restated as data-contract test assertions |

### Post-review addendum (same day)

| Severity | Area | Finding | Fix |
|---|---|---|---|
| **High (cartography)** | Projection | With no basemap, the view inherited WGS84 from the GeoJSON boundaries and rendered equirectangular — NI visibly stretched east–west (client-reported) | Both views now explicitly run in **Web Mercator** (the projection of the OSM basemap and of the existing Greenspace NI Map; locally shape-true at NI's latitude). Boundary/label queries pinned to the view SR. Verified: view wkid 102100, correct shape, selection/labels/sync regressions clean. Literal Irish Grid was considered and rejected because the vector-tile basemap can only render in Mercator |

## UX/UI improvements implemented

- **Hover tooltip on the choropleth** (council name + current metric value + "click for the full profile") — follows the cursor, glass-styled, `role="tooltip"`.
- **Context-layer legend**: when Outscape layers are toggled on, the legend gains matching swatches (incl. "zoom in" hints for point layers).
- **Modals**: Esc closes, close button takes focus on open.
- **Search**: arrow-key navigation with visible highlight and correct `aria-selected`.
- **Backdrop selector** (client request): None / Dark / Streets. One verified keyless source (the OSM vector style used by the existing Greenspace NI Map); "Dark" mutes it with SDK layer effects (grayscale + brightness) to sit under the midnight theme, and any active backdrop drops the choropleth to 85% opacity so geography ghosts through (stated in the panel). Defaults to Dark; the provision map keeps full OSM.

## Test & build status (all executed)

- `tsc --noEmit` ✅ · `eslint .` ✅ (new gate) · `vitest run` ✅ **18/18** (7 data-contract + 11 new: reducer behaviour, renderer class edges/no-gap-no-overlap, metric→field mapping, provision vintage selection & formatting)
- Production build ✅; headless QA of the built app: layer order, tooltip (verified against published values — Mid Ulster 75.5%), legend swatches, Esc handling, search nav, PvP regression — zero page errors.
- CI now runs typecheck + lint + tests + build on every push.

## Verified live (online)

- Council Analysis service: 44 rows / 4 vintages confirmed; values and codes as above.
- Post-deploy: layers draw above the choropleth on the production URL.

## Outstanding / not verifiable from this environment

- Esri basemap tiles and the four Outscape layers render only when online — re-confirmed at service level and post-deploy by the client's smoke test; keep an eye on the access-point/bluespace layers' zoom thresholds (they appear below ~1:1.2M scale by design).
- Licence-year TBC (2024 vs 2026) still awaits Outscape confirmation (tracked in ROADMAP).
- The provision service's 2026 vintage is used and labelled; whether Outscape prefers the 2025 vintage shown for the demo narrative is a one-line config choice — ask at the demo.

## Stage 3 live review (4 Nov 2026, evening — in-browser on the production URL)

First review conducted in a real online browser against the deployed app. Confirmed
working live: dark backdrop + choropleth + labels; greenspace sites drawing over the
index fills (the earlier draw-order fix); Belfast selection; PvP split with full OSM
basemap, live access points/greenspace, council indicators (72.7/99.8/100.0%, "2026
vintage"); Compare postcode-areas view; interactive scorer recalculating correctly
(72.5% check); tablet layout; zero console errors throughout.

| Severity | Finding | Fix |
|---|---|---|
| **High (live bug)** | The SDZ surface rendered nothing despite layer/filter/order all correct — isolated by live in-page experiments to the constructed `ClassBreaksRenderer` instance silently failing on a FeatureLayer in SDK 5.1.27 (the identical autocast object draws; the GeoJSON choropleth's constructed renderer is unaffected) | `buildSdzRenderer` now returns the autocast properties object; verified painting across NI on the production URL after deploy |
| Low (UX) | "Preparing map…" chip cleared on view-ready, seconds before the choropleth's first paint (client tessellation + service latency; one ORNI SDZ tile took 15.8 s) | Chip now holds until the boundary layer-view finishes its first update |

Perf note: app shell itself is fast (DCL ~450 ms cached); visible wait is dominated by
ArcGIS service responses and first tessellation — service-side, mitigated by the
loading chip and per-layer status chips.

## Readiness

**Ready for Stage 3.** The codebase now has a full quality gate (types, lint, tests, build) in CI, the live defect class that slipped past offline QA (draw order) is covered by a programmatic layer-stack check, and data-integrity handling of the multi-vintage provision service is explicit and tested.
