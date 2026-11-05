# Greenspace Access NI

*Understanding Access, Quality & Wellbeing Across Northern Ireland*

A premium geospatial intelligence application for **Outscape**, pairing the proposed
survey-based **Greenspace Standards Index** (56 Degree Insight / POMNI 2025, interim)
with the live, published provision mapping of the **Greenspace NI Map**. Companion to
<https://out-scape.com/greenspace-ni-map/>.

**Live app:** <https://johnchewitt.github.io/greenspace-access-ni/>

## Views

| View | What it shows |
|---|---|
| Overview | Landing experience and executive summary with live headline indicators |
| Explore | The index choropleth across the 11 councils (% and index formats), council profiles, Greenspace NI Map layers |
| Standards | The proposed standards, every survey statement's results, and an interactive scoring explainer |
| Accessibility | Published household walking access (400 m / 1 km / 2 km) at Super Data Zone level |
| Insights | Dashboard (live KPIs), geographic comparisons (councils, postcode areas/sectors, two-council), opportunity screening |
| Perception vs Provision | The signature split view: survey perceptions beside mapped provision, with a four-quadrant evidence drawer |
| Story | Six guided chapters with map choreography |
| About | Purpose, sources, methodology, limitations and attribution |

Plus: branded **PDF report generation** (A4 landscape, via the browser's print-to-PDF)
for the current selection, a first-visit guided tour, and a reset-view map control.

## Stack

React 19 + TypeScript (strict) · Vite · ArcGIS Maps SDK for JavaScript 5.1
(`@arcgis/map-components`) · Calcite · ECharts · Vitest + ESLint.

Resilience: council boundaries, all survey data, fonts and the SDK's assets are bundled,
so the core application works with every external service unreachable; live services
degrade to labelled notes, never invented numbers.

## Data integrity

- `data/` is generated solely by `scripts/extract_data.py` from the source report and is
  never edited by hand; data-contract tests assert the key published values on every build.
- Published values are shown as published — never recomputed, estimated or extrapolated.
- Survey perception ≠ mapped provision: the two are never combined into one score, and
  divergence is always framed as a prompt for investigation, not a proven gap.
- Live figures are queried from verified ORNI/Outscape services (see
  `app/src/config/services.ts`, each URL carries its verification date) and labelled with
  their analysis vintage.

See `GREESPACE_METHODOLOGY.md`, `DATA_SOURCES.md` and `EXISTING_GIS_SERVICES.md`.

## Development

```bash
cd app
npm ci            # Node 20+
npm run dev       # dev server
npx tsc --noEmit  # typecheck
npx eslint .      # lint
npx vitest run    # tests (incl. data-contract tests)
npm run build     # production build (dist/)
npm run preview   # serve the production build
```

No environment variables or API keys are required: all services used are public, and the
OSM vector basemap item is keyless. Never commit credentials; the source report is
deliberately excluded from the repository (see `.gitignore`).

## Deployment

Pushing to `main` runs `.github/workflows/deploy.yml`: typecheck → lint → tests → build →
GitHub Pages. Vite `base` is `./`, so the build is path-independent for static hosting.
A deploy swaps hashed assets; a tab opened mid-deploy may log transient 404s until
reloaded.

## Attribution

Greenspace Standards Index: 56 Degree Insight analysis of POMNI 2025 (interim, proposed
methodology) for Outscape. Greenspace, trails, access points & provision analysis:
GreenspaceNI Map, Outdoor Recreation NI / Outscape, funded by DAERA & DfI — contains
public sector information licensed under the Open Government Licence v3.0; © Crown
copyright and database right Land & Property Services, NIMA MOU577.2 (licence year TBC —
to be confirmed with Outscape). Council boundaries derived from OSNI Open Data (OGL v3).
Basemap © OpenStreetMap contributors, © Esri. Built with the ArcGIS Maps SDK for
JavaScript.
