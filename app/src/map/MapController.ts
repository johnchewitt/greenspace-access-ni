import esriConfig from "@arcgis/core/config";
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils";
import EsriMap from "@arcgis/core/Map";
import GeoJSONLayer from "@arcgis/core/layers/GeoJSONLayer";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import VectorTileLayer from "@arcgis/core/layers/VectorTileLayer";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Graphic from "@arcgis/core/Graphic";
import Extent from "@arcgis/core/geometry/Extent";
import Point from "@arcgis/core/geometry/Point";
import SpatialReference from "@arcgis/core/geometry/SpatialReference";
import { geographicToWebMercator } from "@arcgis/core/geometry/support/webMercatorUtils";
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol";
import SimpleLineSymbol from "@arcgis/core/symbols/SimpleLineSymbol";
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol";
import SimpleRenderer from "@arcgis/core/renderers/SimpleRenderer";
import FeatureFilter from "@arcgis/core/layers/support/FeatureFilter";
import FeatureEffect from "@arcgis/core/layers/support/FeatureEffect";
import type MapView from "@arcgis/core/views/MapView";
import type Layer from "@arcgis/core/layers/Layer";
import type UniqueValueRenderer from "@arcgis/core/renderers/UniqueValueRenderer";
import type Geometry from "@arcgis/core/geometry/Geometry";


import type { FormatId, MetricId } from "../data";
import { buildPointRenderer, buildRenderer, buildSdzRenderer } from "./renderers";
import {
  localData,
  osmVectorBasemapItemId,
  outscapeLayers,
  sdzDefinitionFor,
  sdzProvision,
  type RemoteLayerConfig,
} from "../config/services";
import { palette } from "../config/branding";
import type { BasemapStyle, LayerId, ServiceState } from "../state/AppState";

// SDK assets ship with the app — no runtime dependency on js.arcgis.com.
esriConfig.assetsPath = `${import.meta.env.BASE_URL}arcgis-assets`;

const NI_EXTENT_GEOGRAPHIC = new Extent({
  xmin: -8.4,
  ymin: 53.95,
  xmax: -5.2,
  ymax: 55.45,
  spatialReference: { wkid: 4326 },
});

/**
 * All views run in Web Mercator — the projection of the OSM basemap and of
 * Outscape's existing Greenspace NI Map, and locally shape-true at NI's
 * latitude. Without this, a basemap-less view inherits WGS84 from the GeoJSON
 * boundaries and renders equirectangular (visibly stretched east–west).
 */
export const NI_EXTENT = geographicToWebMercator(NI_EXTENT_GEOGRAPHIC) as Extent;

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export type StatusCb = (id: string, state: ServiceState) => void;

function watchLayerStatus(layer: Layer, id: string, onStatus: StatusCb) {
  onStatus(id, "loading");
  layer
    .load()
    .then(() => onStatus(id, "ok"))
    .catch(() => onStatus(id, "error"));
}

export interface PostcodePointRow {
  kind: "districts" | "sectors";
  code: string;
  place: string;
  lon: number;
  lat: number;
  n: number;
  total_pct: number;
  total_index: number;
  idx_at: number;
  idx_aw: number;
  idx_q: number;
  idx_b: number;
}

/** Faint cream wash + hairline for settlement footprints over the dark theme. */
function settlementSymbol(fillAlpha: number, lineWidth: number): SimpleFillSymbol {
  return new SimpleFillSymbol({
    color: [242, 244, 233, Math.round(fillAlpha * 255) / 255],
    outline: new SimpleLineSymbol({ color: [242, 244, 233, 0.4], width: lineWidth }),
  });
}

function makeRemoteLayer(cfg: RemoteLayerConfig): FeatureLayer {
  return new FeatureLayer({
    url: cfg.url,
    title: cfg.title,
    definitionExpression: cfg.definitionExpression,
    outFields: ["*"],
    popupEnabled: false,
    visible: false,
  });
}

/** Styling for the Outscape context layers — subtle, never louder than the choropleth. */
function styleRemote(id: LayerId, layer: FeatureLayer) {
  switch (id) {
    case "greenspace":
      layer.renderer = new SimpleRenderer({
        symbol: new SimpleFillSymbol({
          color: "rgba(184, 232, 131, 0.32)",
          outline: { color: "rgba(184, 232, 131, 0.55)", width: 0.6 },
        }),
      });
      layer.opacity = 0.95;
      break;
    case "trails":
      layer.renderer = new SimpleRenderer({
        symbol: new SimpleLineSymbol({ color: "rgba(67, 220, 193, 0.8)", width: 1.1 }),
      });
      break;
    case "accessPoints":
      layer.renderer = new SimpleRenderer({
        symbol: new SimpleMarkerSymbol({
          size: 5,
          color: palette.gold,
          outline: { color: "rgba(8,29,40,0.9)", width: 0.8 },
        }),
      });
      layer.minScale = 1_200_000; // scale-dependent: points appear once zoomed in
      break;
    case "bluespace":
      layer.renderer = new SimpleRenderer({
        symbol: new SimpleMarkerSymbol({
          size: 5,
          style: "diamond",
          color: "#7FAEF5",
          outline: { color: "rgba(8,29,40,0.9)", width: 0.8 },
        }),
      });
      layer.minScale = 1_200_000;
      break;
  }
}

export class MapController {
  view: MapView | null = null;
  lgdLayer: GeoJSONLayer;
  selectionLayer = new GraphicsLayer({ listMode: "hide" });
  remote: Record<LayerId, FeatureLayer | GeoJSONLayer>;
  basemapLayer: VectorTileLayer | null = null;
  sdzLayer: FeatureLayer | null = null;
  private geometriesByCode = new globalThis.Map<string, Geometry>();
  private choroplethDimmed = false;
  private hoverCode: string | null = null;
  onSelect: ((code: string | null) => void) | null = null;
  onHover: ((code: string | null, x: number, y: number) => void) | null = null;

  setOnSelect(cb: ((code: string | null) => void) | null) {
    this.onSelect = cb;
  }
  setOnHover(cb: ((code: string | null, x: number, y: number) => void) | null) {
    this.onHover = cb;
  }
  private onStatus: StatusCb;

  constructor(onStatus: StatusCb, withChoropleth = true) {
    this.onStatus = onStatus;
    this.lgdLayer = new GeoJSONLayer({
      url: `${import.meta.env.BASE_URL}${localData.lgdBoundaries}`,
      title: "Greenspace Index (survey perceptions)",
      outFields: ["*"],
      popupEnabled: false,
      renderer: buildRenderer("total", "pct"),
      visible: withChoropleth,
    });
    this.remote = {
      greenspace: makeRemoteLayer(outscapeLayers.greenspace),
      trails: makeRemoteLayer(outscapeLayers.trails),
      accessPoints: makeRemoteLayer(outscapeLayers.accessPoints),
      bluespace: makeRemoteLayer(outscapeLayers.bluespace),
      // Bundled OSNI 50k settlement footprints — unlabelled context (the
      // source carries no name attribute), classed by settlement size.
      settlements: new GeoJSONLayer({
        url: `${import.meta.env.BASE_URL}${localData.settlements}`,
        title: "Settlement footprints (OSNI 50k)",
        copyright: "OSNI Open Data",
        popupEnabled: false,
        visible: false,
        renderer: {
          type: "unique-value",
          field: "cls",
          uniqueValueInfos: [
            { value: "LRG_TOWN", symbol: settlementSymbol(0.1, 1.1) },
            { value: "TOWN", symbol: settlementSymbol(0.09, 0.9) },
            { value: "VILLAGE", symbol: settlementSymbol(0.07, 0.7) },
            { value: "SMALL_VILL", symbol: settlementSymbol(0.05, 0.5) },
          ],
        } as unknown as UniqueValueRenderer,
      }),
    };
    (Object.keys(this.remote) as LayerId[]).forEach((id) => {
      const layer = this.remote[id];
      if (id !== "settlements" && layer instanceof FeatureLayer) styleRemote(id, layer);
    });
  }

  /** Attach to an <arcgis-map> element's ready view. */
  attach(view: MapView) {
    this.view = view;
    view.spatialReference = SpatialReference.WebMercator;
    // Draw order (bottom → top): index choropleth first, then the Outscape
    // context layers ABOVE it so they stay visible over the opaque fills,
    // selection outline topmost. (Basemap, when enabled, is unshifted below all.)
    view.map = new EsriMap({
      layers: [
        this.lgdLayer,
        this.remote.settlements,
        this.remote.greenspace,
        this.remote.trails,
        this.remote.bluespace,
        this.remote.accessPoints,
        this.selectionLayer,
      ],
    });
    view.constraints = { minZoom: 6, maxZoom: 14, rotationEnabled: false, snapToZoom: false };
    view.ui.remove("zoom");
    view.extent = NI_EXTENT;
    view.padding = { left: 40, right: 40, top: 30, bottom: 60 };
    (view as unknown as { background: object }).background = { color: palette.navy };

    watchLayerStatus(this.lgdLayer, "boundaries", this.onStatus);

    // cache geometries for selection/zoom + register interactions
    this.lgdLayer
      .queryFeatures({
        where: "1=1",
        returnGeometry: true,
        outFields: ["code"],
        outSpatialReference: SpatialReference.WebMercator,
      })
      .then((fs) => {
        fs.features.forEach((f) => this.geometriesByCode.set(f.attributes.code, f.geometry!));
      })
      .catch(() => undefined);

    view.on("click", async (e) => {
      const include: Layer[] = [this.lgdLayer];
      if (this.postcodeLayer?.visible) include.push(this.postcodeLayer);
      const hit = await view.hitTest(e, { include });
      const graphics = hit.results.filter((r) => r.type === "graphic") as { graphic: Graphic }[];
      const pc = graphics.find((g) => g.graphic.layer === this.postcodeLayer);
      if (pc) {
        this.onSelectPostcode?.(pc.graphic.attributes.code as string);
        return;
      }
      // with postcode markers up, empty clicks clear the postcode selection
      if (this.postcodeLayer?.visible) {
        this.onSelectPostcode?.(null);
        return;
      }
      this.onSelect?.(graphics.length ? (graphics[0].graphic.attributes.code as string) : null);
    });

    let moveFrame = 0;
    view.on("pointer-move", (e) => {
      if (moveFrame) return;
      moveFrame = requestAnimationFrame(async () => {
        moveFrame = 0;
        // With postcode markers up, the council tooltip would mislead (clicks
        // select markers, not councils) — offer a pointer only over markers.
        if (this.postcodeLayer?.visible) {
          if (this.hoverCode) {
            this.hoverCode = null;
            this.onHover?.(null, 0, 0);
          }
          const pcHit = await view.hitTest(e, { include: [this.postcodeLayer] });
          view.container!.style.cursor = pcHit.results.some((r) => r.type === "graphic")
            ? "pointer"
            : "default";
          return;
        }
        if (!this.lgdLayer.visible) return;
        const hit = await view.hitTest(e, { include: [this.lgdLayer] });
        const g = hit.results.find((r) => r.type === "graphic") as
          | { graphic: Graphic }
          | undefined;
        const code = g ? (g.graphic.attributes.code as string) : null;
        if (code !== this.hoverCode) {
          this.hoverCode = code;
          view.container!.style.cursor = code ? "pointer" : "default";
        }
        this.onHover?.(code, e.x, e.y);
      });
    });
  }

  /** Resolves when the boundary layer has drawn for the first time. */
  async whenFirstPaint(): Promise<void> {
    const view = this.view;
    if (!view) return;
    await view.when();
    const lv = await view.whenLayerView(this.lgdLayer).catch(() => null);
    if (lv) {
      await reactiveUtils.whenOnce(() => lv.updating === false);
    }
  }

  setRenderer(metric: MetricId, format: FormatId) {
    this.lgdLayer.renderer = buildRenderer(metric, format);
  }

  async select(code: string | null, zoom = true) {
    this.selectionLayer.removeAll();
    const view = this.view;
    if (!view) return;
    const lv = await view.whenLayerView(this.lgdLayer).catch(() => null);
    if (!code) {
      if (lv) lv.featureEffect = null as unknown as FeatureEffect;
      if (!zoom) return;
      if (!prefersReducedMotion()) view.goTo(NI_EXTENT, { duration: 700 }).catch(() => undefined);
      else view.extent = NI_EXTENT;
      return;
    }
    const geom = this.geometriesByCode.get(code);
    if (geom) {
      this.selectionLayer.add(
        new Graphic({
          geometry: geom,
          symbol: new SimpleFillSymbol({
            color: "rgba(226, 183, 107, 0.05)",
            outline: { color: palette.gold, width: 2.4 },
          }),
        }),
      );
      if (zoom) {
        const target = (geom.extent ?? NI_EXTENT).clone().expand(2.3);
        if (!prefersReducedMotion()) {
          view.goTo(target, { duration: 800, easing: "ease-in-out" }).catch(() => undefined);
        } else {
          view.extent = target;
        }
      }
    }
    if (lv) {
      lv.featureEffect = new FeatureEffect({
        filter: new FeatureFilter({ where: `code = '${code}'` }),
        excludedEffect: "opacity(45%) saturate(70%)",
      });
    }
  }

  setLayerVisible(id: LayerId, on: boolean) {
    const layer = this.remote[id];
    if (on && layer.loadStatus === "not-loaded") {
      watchLayerStatus(layer, id, this.onStatus);
    }
    layer.visible = on;
  }

  /**
   * Backdrop presentation. One verified keyless source (the OSM vector style
   * used by the existing Greenspace NI Map); "dark" mutes it with layer
   * effects to sit under the midnight theme. When a backdrop is visible the
   * choropleth drops to 85% opacity so geography ghosts through (noted in the
   * legend).
   */
  setBasemap(style: BasemapStyle) {
    const view = this.view;
    if (!view) return;
    if (style !== "none" && !this.basemapLayer) {
      this.basemapLayer = new VectorTileLayer({
        portalItem: { id: osmVectorBasemapItemId },
      });
      watchLayerStatus(this.basemapLayer, "basemap", this.onStatus);
      view.map?.layers.unshift(this.basemapLayer);
    }
    if (this.basemapLayer) {
      this.basemapLayer.visible = style !== "none";
      if (style === "dark") {
        this.basemapLayer.effect = "grayscale(0.8) brightness(0.5) contrast(1.05)";
        this.basemapLayer.opacity = 0.75;
      } else if (style === "greyscale") {
        this.basemapLayer.effect = "grayscale(1) brightness(1.08)";
        this.basemapLayer.opacity = 0.9;
      } else if (style === "streets") {
        this.basemapLayer.effect = "saturate(0.85)";
        this.basemapLayer.opacity = 0.85;
      }
    }
    this.lgdLayer.opacity = this.choroplethDimmed ? 0.25 : style === "none" ? 1 : 0.85;
  }

  setChoroplethVisible(on: boolean) {
    this.lgdLayer.visible = on;
  }

  /** Ghost the council fills so marker geographies read on top. */
  setChoroplethDimmed(on: boolean) {
    this.choroplethDimmed = on;
    this.lgdLayer.opacity = on ? 0.25 : this.basemapLayer?.visible ? 0.85 : 1;
  }

  /**
   * Published SDZ household-proximity surface (provision map). Lazily created;
   * drawn above the backdrop and below the council outlines.
   */
  setSdz(on: boolean) {
    const view = this.view;
    if (!view) return;
    if (on && !this.sdzLayer) {
      this.sdzLayer = new FeatureLayer({
        url: sdzProvision.url,
        title: sdzProvision.title,
        definitionExpression: sdzProvision.definitionExpression,
        outFields: ["SDZ_Name", "Percent400", "Percent1km", "Percent2km", "Year_"],
        popupEnabled: false,
        renderer: buildSdzRenderer(),
        opacity: 0.8,
      });
      watchLayerStatus(this.sdzLayer, "sdz", this.onStatus);
      view.map?.layers.add(this.sdzLayer, view.map.layers.indexOf(this.lgdLayer));
    }
    if (this.sdzLayer) this.sdzLayer.visible = on;
  }

  setSdzField(field: "Percent400" | "Percent1km" | "Percent2km") {
    if (!this.sdzLayer) return;
    this.sdzLayer.renderer = buildSdzRenderer(field);
    // The 2026 vintage has no 2 km values at SDZ level, so each threshold pins
    // the latest vintage that computed it (see sdzVintageByField) — otherwise
    // the 2 km surface would render nothing.
    this.sdzLayer.definitionExpression = sdzDefinitionFor(field);
  }

  // ——— Postcode marker geographies (no open-licence boundaries exist, so
  // published results render as markers at reference points, never polygons).
  postcodeLayer: GeoJSONLayer | null = null;
  private postcodeAnchors = new globalThis.Map<string, Point>();
  private onSelectPostcode: ((code: string | null) => void) | null = null;

  setOnSelectPostcode(cb: ((code: string | null) => void) | null) {
    this.onSelectPostcode = cb;
  }

  /**
   * Build the marker layer once from joined published results. A GeoJSONLayer
   * over a Blob URL, not a client-side FeatureLayer source: in SDK 5.1.27 the
   * latter silently paints nothing (48 features in the layer view, zero
   * pixels, even with a flat SimpleRenderer) — the same family of quirk as
   * the constructed-ClassBreaksRenderer failure documented in renderers.ts.
   */
  setPostcodeData(rows: PostcodePointRow[]) {
    if (this.postcodeLayer || !this.view) return;
    rows.forEach((r) => {
      this.postcodeAnchors.set(
        r.code,
        geographicToWebMercator(
          new Point({ longitude: r.lon, latitude: r.lat, spatialReference: SpatialReference.WGS84 }),
        ) as Point,
      );
    });
    const fc = {
      type: "FeatureCollection",
      features: rows.map((r) => ({
        type: "Feature",
        properties: {
          kind: r.kind,
          code: r.code,
          place: r.place,
          n: r.n,
          total_pct: r.total_pct,
          total_index: r.total_index,
          idx_at: r.idx_at,
          idx_aw: r.idx_aw,
          idx_q: r.idx_q,
          idx_b: r.idx_b,
        },
        geometry: { type: "Point", coordinates: [r.lon, r.lat] },
      })),
    };
    this.postcodeLayer = new GeoJSONLayer({
      url: URL.createObjectURL(new Blob([JSON.stringify(fc)], { type: "application/json" })),
      title: "Postcode results (reference points)",
      copyright: "Published POMNI 2025 results at postcode reference points",
      popupEnabled: false,
      visible: false,
      renderer: buildPointRenderer("total", "pct"),
    });
    // above the choropleth and context layers, below the selection halo
    this.view.map?.layers.add(this.postcodeLayer, this.view.map.layers.indexOf(this.selectionLayer));
  }

  setPostcodeGeography(kind: "districts" | "sectors" | null) {
    if (!this.postcodeLayer) return;
    this.postcodeLayer.visible = kind !== null;
    if (kind) this.postcodeLayer.definitionExpression = `kind = '${kind}'`;
  }

  setPostcodeRenderer(metric: MetricId, format: FormatId) {
    if (this.postcodeLayer) this.postcodeLayer.renderer = buildPointRenderer(metric, format);
  }

  /** Gold halo + zoom for a selected postcode reference point. */
  selectPostcode(code: string | null, kind: "districts" | "sectors", zoom = true) {
    this.selectionLayer.removeAll();
    const view = this.view;
    if (!view || !code) return;
    const pt = this.postcodeAnchors.get(code);
    if (!pt) return;
    this.selectionLayer.add(
      new Graphic({
        geometry: pt,
        symbol: new SimpleMarkerSymbol({
          style: "circle",
          size: 20,
          color: [226, 183, 107, 0.12],
          outline: { color: palette.gold, width: 2.2 },
        }),
      }),
    );
    if (zoom) {
      const scale = kind === "districts" ? 220000 : 100000;
      if (!prefersReducedMotion()) {
        view.goTo({ target: pt, scale }, { duration: 800, easing: "ease-in-out" }).catch(() => undefined);
      } else {
        view.center = pt;
        view.scale = scale;
      }
    }
  }

  /** Zoom to one Super Data Zone on the provision surface (by SDZ_Code). */
  async zoomToSdz(code: string) {
    const view = this.view;
    if (!view || !this.sdzLayer) return;
    try {
      const fs = await this.sdzLayer.queryFeatures({
        where: `SDZ_Code = '${code.replace(/'/g, "''")}' AND ${sdzProvision.definitionExpression}`,
        returnGeometry: true,
        outFields: ["SDZ_Name"],
        outSpatialReference: view.spatialReference,
      } as unknown as Parameters<FeatureLayer["queryFeatures"]>[0]);
      const geom = fs.features[0]?.geometry;
      if (!geom?.extent) return;
      const target = geom.extent.clone().expand(5);
      if (!prefersReducedMotion()) {
        await view.goTo(target, { duration: 800, easing: "ease-in-out" }).catch(() => undefined);
      } else {
        view.extent = target;
      }
    } catch {
      /* zoom is a convenience — never fatal */
    }
  }

  /**
   * Emphasise a set of councils (quadrant filtering): others fade. Kept
   * separate from single-council selection; selection wins when active.
   */
  async emphasize(codes: string[] | null) {
    const view = this.view;
    if (!view) return;
    const lv = await view.whenLayerView(this.lgdLayer).catch(() => null);
    if (!lv) return;
    if (!codes || codes.length === 0) {
      lv.featureEffect = null as unknown as FeatureEffect;
      return;
    }
    const list = codes.map((c) => `'${c}'`).join(",");
    lv.featureEffect = new FeatureEffect({
      filter: new FeatureFilter({ where: `code IN (${list})` }),
      excludedEffect: "opacity(30%) saturate(50%)",
      includedEffect: "brightness(1.05)",
    });
  }

  /** Reference mode for the provision map: council outlines only, no fills. */
  useOutlineStyle() {
    this.lgdLayer.renderer = new SimpleRenderer({
      symbol: new SimpleFillSymbol({
        color: "rgba(0,0,0,0)",
        outline: { color: "rgba(242,244,233,0.55)", width: 1 },
      }),
    });
    this.lgdLayer.visible = true;
  }
}
