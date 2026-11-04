import esriConfig from "@arcgis/core/config";
import EsriMap from "@arcgis/core/Map";
import GeoJSONLayer from "@arcgis/core/layers/GeoJSONLayer";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import VectorTileLayer from "@arcgis/core/layers/VectorTileLayer";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Graphic from "@arcgis/core/Graphic";
import Extent from "@arcgis/core/geometry/Extent";
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol";
import SimpleLineSymbol from "@arcgis/core/symbols/SimpleLineSymbol";
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol";
import SimpleRenderer from "@arcgis/core/renderers/SimpleRenderer";
import FeatureFilter from "@arcgis/core/layers/support/FeatureFilter";
import FeatureEffect from "@arcgis/core/layers/support/FeatureEffect";
import type MapView from "@arcgis/core/views/MapView";
import type Layer from "@arcgis/core/layers/Layer";
import type Geometry from "@arcgis/core/geometry/Geometry";


import type { FormatId, MetricId } from "../data";
import { buildRenderer } from "./renderers";
import {
  localData,
  osmVectorBasemapItemId,
  outscapeLayers,
  type RemoteLayerConfig,
} from "../config/services";
import { palette } from "../config/branding";
import type { LayerId, ServiceState } from "../state/AppState";

// SDK assets ship with the app — no runtime dependency on js.arcgis.com.
esriConfig.assetsPath = `${import.meta.env.BASE_URL}arcgis-assets`;

export const NI_EXTENT = new Extent({
  xmin: -8.4,
  ymin: 53.95,
  xmax: -5.2,
  ymax: 55.45,
  spatialReference: { wkid: 4326 },
});

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
  remote: Record<LayerId, FeatureLayer>;
  basemapLayer: VectorTileLayer | null = null;
  private geometriesByCode = new globalThis.Map<string, Geometry>();
  private hoverCode: string | null = null;
  onSelect: ((code: string | null) => void) | null = null;
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
    };
    (Object.keys(this.remote) as LayerId[]).forEach((id) =>
      styleRemote(id, this.remote[id]),
    );
  }

  /** Attach to an <arcgis-map> element's ready view. */
  attach(view: MapView) {
    this.view = view;
    view.map = new EsriMap({
      layers: [
        this.remote.greenspace,
        this.remote.trails,
        this.remote.bluespace,
        this.remote.accessPoints,
        this.lgdLayer,
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
      .queryFeatures({ where: "1=1", returnGeometry: true, outFields: ["code"] })
      .then((fs) => {
        fs.features.forEach((f) => this.geometriesByCode.set(f.attributes.code, f.geometry!));
      })
      .catch(() => undefined);

    view.on("click", async (e) => {
      const hit = await view.hitTest(e, { include: [this.lgdLayer] });
      const g = hit.results.find((r) => r.type === "graphic") as
        | { graphic: Graphic }
        | undefined;
      this.onSelect?.(g ? (g.graphic.attributes.code as string) : null);
    });

    let moveFrame = 0;
    view.on("pointer-move", (e) => {
      if (moveFrame) return;
      moveFrame = requestAnimationFrame(async () => {
        moveFrame = 0;
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
      });
    });
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

  setBasemap(on: boolean) {
    const view = this.view;
    if (!view) return;
    if (on && !this.basemapLayer) {
      this.basemapLayer = new VectorTileLayer({
        portalItem: { id: osmVectorBasemapItemId },
        opacity: 0.55,
      });
      watchLayerStatus(this.basemapLayer, "basemap", this.onStatus);
      view.map?.layers.unshift(this.basemapLayer);
    }
    if (this.basemapLayer) this.basemapLayer.visible = on;
  }

  setChoroplethVisible(on: boolean) {
    this.lgdLayer.visible = on;
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
