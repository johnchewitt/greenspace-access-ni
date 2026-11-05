/**
 * Every external service URL used by Greenspace Access NI.
 * All endpoints below were verified by live anonymous REST queries.
 * See EXISTING_GIS_SERVICES.md and DATA_SOURCES.md for provenance.
 */
const ORNI = "https://services7.arcgis.com/rVwbcvflURVxkV6s/arcgis/rest/services";

export interface RemoteLayerConfig {
  id: string;
  title: string;
  url: string;
  verified: string; // date of last live verification
  definitionExpression?: string;
  note?: string;
}

/** Outscape / ORNI content layers (public view services). */
export const outscapeLayers: Record<string, RemoteLayerConfig> = {
  greenspace: {
    id: "greenspace",
    title: "NI Greenspace",
    url: `${ORNI}/Greenspace_3_view/FeatureServer/4`,
    definitionExpression: "ShowOnMap = 'Yes'",
    verified: "2026-11-04",
    note: "1,493 polygons; publicly accessible greenspace ≥0.5 ha; OGL v3 / Crown copyright NIMA MOU577.2",
  },
  accessPoints: {
    id: "accessPoints",
    title: "Greenspace access points",
    url: `${ORNI}/Greenspace_NI_Access_Points_view/FeatureServer/0`,
    definitionExpression: "ShowOnMap = 'Yes' AND Area_Ha >= 2",
    verified: "2026-11-04",
    note: "Desk-created points where the public can reach greenspace (sites ≥2 ha, matching the existing map)",
  },
  trails: {
    id: "trails",
    title: "Off-road trails",
    url: `${ORNI}/Off_Road_Trails_View/FeatureServer/0`,
    definitionExpression: "Infrastructure = 'False'",
    verified: "2026-11-04",
    note: "1,385 off-road trail lines",
  },
  bluespace: {
    id: "bluespace",
    title: "Bluespace access (early-stage)",
    url: `${ORNI}/Bluespace_Access_Points_view/FeatureServer/0`,
    verified: "2026-11-04",
    note: "Early-stage dataset (currency Apr 2023); shown for context only",
  },
};

/**
 * Published objective provision indicators, Super Data Zone level.
 * 3,399 rows = ~850 SDZs x 4 analysis vintages (Year_ 2023-2026, verified by
 * live distinct-values query) — always filter to one vintage.
 */
export const sdzProvision: RemoteLayerConfig = {
  id: "sdzProvision",
  title: "Neighbourhood provision (Super Data Zones)",
  url: `${ORNI}/GreenspaceNI_SDZ_Analysis2025/FeatureServer/0`,
  definitionExpression: "Year_ = '2026'",
  verified: "2026-11-04",
  note: "% of households within 400 m / 1 km / 2 km of greenspace or trails, per SDZ; 2026 analysis vintage",
};

/**
 * Published NI-wide provision indicators (one row per analysis year 2023–2026,
 * verified live; 2026: 48.0% / 75.22% / 84.8% of households within
 * 400 m / 1 km / 2 km of greenspace or trails).
 */
export const allNIAnalysis: RemoteLayerConfig = {
  id: "allNIAnalysis",
  title: "GreenspaceNI All-NI Analysis",
  url: `${ORNI}/GreenspaceNI_AllNIAnalysis2025/FeatureServer/0`,
  verified: "2026-11-04",
  note: "NI-wide % of households within 400 m / 1 km / 2 km; filter to one Year_ vintage",
};

/** Published objective provision indicators, council level, 2025 vintage. */
export const councilProvision2025: RemoteLayerConfig = {
  id: "councilProvision2025",
  title: "GreenspaceNI Council Analysis 2025",
  url: `${ORNI}/GreenspaceNI_Council_Analysis2025/FeatureServer/0`,
  verified: "2026-11-04",
  note: "% of households within 400 m / 1 km / 2 km of greenspace or trails (network analysis from access points)",
};

/**
 * OSM vector basemap style item used by the existing Greenspace NI Map
 * (keyless public item; verified in the existing web map's JSON).
 */
export const osmVectorBasemapItemId = "0df19d2d940b47658857cc2fc9623840";

/** Local (bundled) assets — no network dependency. */
export const localData = {
  lgdBoundaries: "data/ni_lgd_joined.geojson",
};

/** Reserved for future integration (per Stage 1 brief). */
export const futureServices = {
  moveNIAccessibility: null as RemoteLayerConfig | null,
};
