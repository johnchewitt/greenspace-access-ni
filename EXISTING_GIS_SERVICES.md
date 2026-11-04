# EXISTING_GIS_SERVICES.md — Greenspace NI Map infrastructure

Verified inventory of the GIS services behind Outscape's existing **Greenspace NI Map**
(https://out-scape.com/greenspace-ni-map/), investigated 4 Nov 2026. Every URL below was
queried live during Stage 1 (anonymous REST requests); nothing is assumed or invented.
ArcGIS Online organisation: **outdoorrecni** (`outdoorrecni.maps.arcgis.com`), hosted
feature services on `services7.arcgis.com/rVwbcvflURVxkV6s`.

## 1. Public applications

| App | Type | URL / Item ID | Notes |
|---|---|---|---|
| GreenspaceNI Public Dashboard | ArcGIS Dashboard | `arcgis.com/apps/dashboards/4729f13c1f4a402d844def083dac887c` | Owner `john_hewitt`, shared **Public**. Created Jun 2023, modified Jul 2026. Uses web map `c6058beb…` below. |
| Insights & Analysis | Experience Builder | `experience.arcgis.com/experience/f20270ac90f14284a221327aa7c0806b` | Pages for All-NI, Council, Parliamentary Constituency, SOA/SDZ using the 2025 analysis layers. |
| Household Analysis | ArcGIS Dashboard | `arcgis.com/apps/dashboards/79d70462b87b4525892392320f4354f3` | Not inspected in depth (same org/layer family). |
| GreenspaceNI Map Viewer ("Try it for yourself") | Web AppBuilder | `outdoorrecni.maps.arcgis.com/apps/webappviewer/index.html?id=d1b8e59f7842408cb869648fcc28eac8` | Uses web map `c5b0b4fac8e74684bb4d67052eacea33`. |
| Feedback survey | Survey123 | `survey123.arcgis.com/share/839b1476a79a4d8184a0b3eef47bb8e4` | — |

**Web maps:** Dashboard map `c6058beb16f64272a5f2bdd90899f004` ("Greenspace, Trails and
Settlements"; OpenStreetMap vector basemap, Web Mercator). Viewer map
`c5b0b4fac8e74684bb4d67052eacea33` (adds SOA deprivation + 2025 proximity-analysis group).

## 2. Core content layers (verified schemas)

Base REST root for all: `https://services7.arcgis.com/rVwbcvflURVxkV6s/arcgis/rest/services/`

### 2.1 NI Greenspace Layer (polygons) — PRIMARY
`…/Greenspace_3_view/FeatureServer/4` · item `9867486d0d6c4beda45d320ded755f62`
- Polygon; **1,493 features** (live count, Nov 2026); source SR **Irish Grid (wkid 29900/29902)**; capabilities `Query,Extract`; maxRecordCount 2000.
- Item: owner `emmataylor5`, **Public**, created Apr 2023, modified Oct 2026, stated currency May 2023 with annual update cycle.
- Fields: `OBJECTID, SourceID, GUID, Name, Source, Category, Type, PaidAccess, Area_Ha, Verified (alias Accuracy), ShowOnMap (Yes/No domain), ORNI_ID, DataAdded, SiteCreated`.
- Inclusion criteria (product metadata): publicly accessible natural greenspace **≥ 0.5 ha** (2 ha threshold used for analysis). Categories: Woodland; Public Parks & Gardens; Amenity Greenspace; Heritage Site; Open Country/Landscape; Nature Reserve.
- Map apps filter with `ShowOnMap`; the dashboard styles by `Type` and sums `Area_Ha`.

### 2.2 NI Greenspace Access Points
`…/Greenspace_NI_Access_Points_view/FeatureServer/0` · item `1b6dade452aa41a09cac3b11736ea0e6`
- Point; capabilities `Query`; fields `OBJECTID, ID, SourceID, GUID, Name, Source, Category, Type, Area_Ha, ShowOnMap, Method, GlobalID`.
- Desk-created (not field-validated). The web map applies `ShowOnMap='Yes' AND Area_Ha>=2`.

### 2.3 NI Off-Road Trails
`…/Off_Road_Trails_View/FeatureServer/0` · item `881115156f08432a8dbd38b40d56bc4a`
- Polyline; **1,385 features** (live count); capabilities `Query,Extract`.
- Fields: `FID, ID, Name, SourceID, Source, GUID, Category, Type, Descriptio, On_Road, Length, Verified, ShowOnMap, County, UpdateDate, Trail_Useage, Infrastructure, Route, DataAdded, SiteCreated`.
- Map apps filter `Infrastructure='False'`; dashboard groups by `Trail_Useage` and sums `Length`. Trail categories: single-use (MTB, footpath PRoW, walking, cycle) and multi-use (carriageway/bridle PRoW, towpath, greenway). A companion `NI_Trails_InfrastructureLayer/FeatureServer/0` (item `713c5a637bbd459493716dc2693def90`) carries trail infrastructure.

### 2.4 NI Bluespace
`…/Bluespace_Access_Points_view/FeatureServer/0` (layer "Bluespace_Points")
- Point; capabilities `Query`; fields `OBJECTID, Name, Type, Category, Source, Facilities, ShowOnMap, LandOwner`.
- Early-stage per product metadata (currency Apr 2023); categories coastal (beaches, coastline, waterfront parks, islands, access points) and inland (rivers, lakes, reservoirs, fisheries, inland islands). Related: `Beaches_Phase3`, `Bluespace_Access_Points_(DAERA_Review)`.

## 3. Published accessibility / provision outputs

### 3.1 2025 analysis family (current vintage; used by Insights & Analysis app)
| Service | Geography |
|---|---|
| `GreenspaceNI_AllNIAnalysis2025/FeatureServer/0` | Northern Ireland |
| `GreenspaceNI_Council_Analysis2025/FeatureServer/0` | 11 councils (LGD) |
| `GreenspaceNI_ParlimentaryConstit_Analysis2025/FeatureServer/0` | Parliamentary constituencies |
| `GreenspaceNI_SOA_Analysis2025` / `GreenspaceNI_SuperOutputArea_Analysis2025/FeatureServer/0` | Super Output Areas |
| `GreenspaceNI_SDZ_Analysis2025/FeatureServer/0` | Super Data Zones (2021) |
| `GreenspaceNI_SettlementAnalysis2025/FeatureServer/0` | Settlements |

Council 2025 schema (verified): `FID, Id, LGDName, LGDCode, AnalysisYe, Percent400, Percent1km, Percent2km, Shape__Area, Shape__Length, Year_, p400m, p1000m` — i.e. **% of households within 400 m / 1 km / 2 km** of greenspace/trails, per council, with `LGDCode` for joins. Polygon geometry (doubles as a council boundary source). Methodology (product metadata): network analysis from access points where available, against the Programme-for-Government "5-minute (400 m) walk to quality greenspace > 2 ha" target.

### 3.2 2023/2024 analysis vintage (used by the public dashboard)
- `Super_Data_Zone_Analysis_and_Provision/FeatureServer/0` (item `4684dd67832f426e9f5d2bdad862d18d`): SDZ polygons with `SDZ2021_cd/nm, DEA2014_cd/nm, LGD2014_cd/nm, All_Addresses, PercentHouseholds400m_Trails, PercentHouseholds400m_GS, PercentHouseholds_400mGSTrail, PercentHouseholds_1kmGSTrail, PercentHouseholds_2kmGSTrail, GreenspaceArea_Ha, TrailLength_Ha`.
- `LGD_400m1km2kmAnalysis_04062024/FeatureServer/25` (item `3d8e3266b9f64756a2f82330d25d6ec0`): council polygons with `LGDNAME, LGDCode, AnalysisYear, sum_Length_MILES, sum_Area_HECTARES, All_Households, PercentageHouseholds400mTrail, PercentageHouseholds400mGS, PercentageHouseholds_400m, PercentageHouseholds1km, PercentageHouseholds2km`.
- Also available: `DEA_400m1km2km_Analysis_06062024`, `Settlements_Analysis_400m_1km_2km_view`, `Greenspace_Proximity_Hexmap` (1 km² grid), `SOA_Deprivation/FeatureServer/9` (NISRA MDM2017), `Greenspace_LGD_NewBuildAnalysis_23to25`.

### 3.3 Context layers
`NI_Environmental_Designations/FeatureServer` (AONB 14, ASSI 13, Ramsar 8, SAC 7, SPA 6; item `4aa5d1c1824e425890440b9ffa2bb088`); flood layers (`Coastal_Flooding_CFRAM`, `River_Flooding_NIFM`); `NI_Coastline_2021`; `National_Public_Transport_Access_Nodes_NaPTAN`; `NI_HealthTrustboundary`.

## 4. Sharing, licensing and reuse

- **Sharing:** every service above answered anonymous REST queries → shared Public. (Public *viewability* ≠ redistribution rights.)
- **Licence:** the NI Greenspace Layer item states **Open Government Licence v3** — copy, adapt, commercial use permitted **with attribution**: *"© Crown copyright and database right (2026) NIMA MOU577.2"* (the item also shows a 2024 year in one place — confirm the year with Outscape before publication). The dashboard item carries matching LPS Crown-copyright terms ("Based upon…" wording where mixed with other IP; short note sufficient under 200 cm²).
- **Usage constraints (product metadata):** not for determining land ownership; access points must not be used to gain entry to restricted sites; positional accuracy not guaranteed; not all areas have full public access; no liability accepted.
- **Explicit licence was found only on the greenspace layer item**; other items (trails, access points, bluespace, analysis layers) did not carry licenseInfo in their service JSON. **Action: confirm with Outscape** (feedback contact in product metadata: emma@out-scape.com) that all layers used in Greenspace Access NI fall under the same OGL/attribution terms — this project is for Outscape itself, so approval should be straightforward, but it must be recorded.
- Product metadata states data "will be published on SpatialNI, OpenDataNI and sometimes OutmoreNI".

## 5. Integration recommendations

1. **Consume, don't copy.** Reference the view services directly in the ArcGIS Maps SDK (`FeatureLayer({ url })`). They are live, public, annually updated, and already filtered via view definitions. Pin layer URLs + item IDs in one config module so a vintage change (e.g. Analysis2026) is a one-line update.
2. **Mirror the existing apps' filters** for faithful numbers: greenspace `ShowOnMap='Yes'`, trails `Infrastructure='False'`, access points `ShowOnMap='Yes' AND Area_Ha>=2`.
3. **Perception ↔ provision join at council level** is clean: perception data carries ONS `N09…` codes; `GreenspaceNI_Council_Analysis2025` carries `LGDCode`. Confirm the code scheme in that field on first query (N09 vs legacy LGD2014) and map once in config.
4. **Geometry note:** source layers are stored in Irish Grid (29900-family) but served to Web Mercator by the REST API; the SDK handles reprojection — no preprocessing needed.
5. **Perception geographies don't match provision geographies** (postcode areas/sectors vs SDZ/SOA/settlement). Only show side-by-side comparisons where geography is compatible (council level, and NI overall); never interpolate between the two systems. See ARCHITECTURE.md §Compare.
6. **Bluespace is early-stage** (2023 currency, sparse schema): display as optional context layer, clearly labelled, not as an analysis input.
7. **Attribution** must appear in the app footer/about and in report exports: OGL v3 + "© Crown copyright and database right (year) NIMA MOU577.2", plus Outscape/ORNI credit for the GreenspaceNI layers and 56 Degree Insight/POMNI for the survey index.
