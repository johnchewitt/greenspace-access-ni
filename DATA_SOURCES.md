# DATA_SOURCES.md — Greenspace Access NI

All sources verified by live queries on 4 Nov 2026 unless noted. Rule: **verified services
and published values only — no invented boundaries, URLs or joins.**

## 1. Survey index data (primary)

| Item | Detail |
|---|---|
| Source | *Development of Greenspace Standard Index — Interim Report v2*, 56 Degree Insight for Outscape, 14 Jul 2026 (PowerPoint) |
| Survey | POMNI 2025 wave, n = 4,000 |
| Extraction | Report's embedded chart workbooks + slide tables → `scripts/extract_data.py` → `data/` (14 JSON/CSV files) |
| Validation | 82/82 geography rows reconcile; slide-23 rankings reproduced; anomalies documented — see DATA_EXTRACTION_VERIFICATION.md |
| Licence | Client's own commissioned study (Outscape); confirm publication permissions with 56 Degree Insight before public launch |
| Gaps | LGD sample sizes unpublished; decile values unpublished; postcode theme *percentages* unpublished (indices only). The report references an accompanying Excel with more detailed outputs — **request from Outscape/56DI** if postcode theme % or deciles are wanted in the app |

## 2. Local authority boundaries — VERIFIED ✔

**ONS Open Geography Portal** — Local Authority Districts (May 2026) Boundaries UK BGC
(generalised, clipped):
`https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services/Local_Authority_Districts_May_2026_Boundaries_UK_BGC/FeatureServer/0`
- Live query `LAD26CD LIKE 'N09%'` returned exactly the 11 NI districts
  (N09000001 Antrim and Newtownabbey … N09000011 Ards and North Down). Fields `LAD26CD`,
  `LAD26NM`. Licence **OGL v3** (ONS Open Geography). Earlier vintages (Dec 2025, Dec 2024…)
  available on the same org if a fixed vintage is preferred; NI LGD geography is unchanged
  since 2015.
- **Join:** report LGD names → ONS codes, fixed 11-row map in `config` (e.g. "Antrim &
  Newtonabbey" [sic] → N09000001; "North Down & Ards" → N09000011). Covered by a unit test.
- Alternatives: Outscape's own council polygons (`GreenspaceNI_Council_Analysis2025`,
  carries `LGDCode` + provision fields — useful double-duty layer); OSNI/Spatial NI LGD
  item referenced on data.gov.uk is **retired** (item `eaa08860…` returns "does not
  exist") — do not use.

## 3. Postcode area & sector geometries — CONSTRAINED ⚠

- NI (BT) postcode data is excluded from the usual open licences: ONS postcode products
  are OGL **except** Northern Ireland, which requires a separate NI end-user licence, and
  no authoritative free BT area/sector polygon dataset exists. Verified polygon products
  are commercial (e.g. Geoplan NI postcode boundaries, Precisely PostMap; OS Code-Point
  with Polygons covers GB only for polygons).
- **Stage-1 decision:** postcode-level results render without choropleths (ranked and
  comparative charts, area detail panels). If Outscape wants postcode maps in a later
  stage: (a) license commercial polygons, or (b) confirm rights to an approximate open
  derivation — either recorded here before use. No approximate boundaries will be drawn
  silently.

## 4. Outscape Greenspace NI Map services

Full inventory, schemas, counts, licence findings and integration rules:
**EXISTING_GIS_SERVICES.md**. Headlines: greenspace polygons (1,493), access points,
off-road trails (1,385), bluespace points (early-stage), environmental designations, and
published provision/accessibility outputs at NI/council/constituency/SOA/SDZ/settlement
levels (2023/24 and 2025 vintages). Public services; greenspace layer explicitly OGL v3
with Crown-copyright/NIMA MOU577.2 attribution; confirm blanket terms with Outscape.

## 5. Other reference data

- **NISRA** context (urban/rural classification, NIMDM deprivation) reaches the app only
  as the survey report's published groupings — no NISRA microdata is consumed. Outscape's
  `SOA_Deprivation` service (MDM2017) is available as a COMPARE context layer if wanted.
- **Basemap:** Esri/ArcGIS basemap styles (OSM vector style matches the existing map;
  choose final style in Stage 2 design pass). Esri attribution automatic via SDK.
- **MOVE NI accessibility analysis:** named future integration; no public service
  identified in Stage 1 — reserved slot in `config/services.ts`, to be specified when
  Outscape provides endpoints.

## 6. Attribution block (app footer / exports)

> Greenspace Standards Index: 56 Degree Insight analysis of POMNI 2025 (interim, proposed
> methodology) for Outscape. Greenspace, trails, access points & provision analysis:
> GreenspaceNI Map, Outdoor Recreation NI / Outscape, funded by DAERA & DfI — contains
> public sector information licensed under OGL v3; © Crown copyright and database right
> (year TBC: 2024 vs 2026 — confirm) Land & Property Services, NIMA MOU577.2. Boundaries:
> Office for National Statistics, OGL v3. Basemap © Esri and contributors.
