import { useEffect, useMemo, useRef, useState } from "react";
import { Header } from "./components/Header";
import { AboutModal, AttributionChip, MethodologyModal } from "./components/Modals";
import { IntegrityChip } from "./components/shared";
import { AreaPanel, KpiStrip, LeftPanel } from "./features/explore/ExplorePanels";
import { CompareOverlay } from "./features/compare/CompareOverlay";
import { UnderstandOverlay } from "./features/understand/UnderstandOverlay";
import {
  PerceptionPanel,
  ProvisionPanel,
  PvpBanner,
  useProvision,
} from "./features/pvp/PvpMode";
import { MapHost } from "./map/MapHost";
import { CouncilLabels } from "./map/CouncilLabels";
import { MapController } from "./map/MapController";
import { useViewSync } from "./map/useViewSync";
import {
  useAppDispatch,
  useAppState,
  type LayerId,
} from "./state/AppState";

const LAYER_IDS: LayerId[] = ["greenspace", "trails", "accessPoints", "bluespace"];

export default function App() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const { mode, metric, format, selectedCode, layers, basemapOn } = state;
  const [pvpOpened, setPvpOpened] = useState(false);

  const statusCb = useRef((id: string, s: "idle" | "loading" | "ok" | "error") =>
    dispatch({ type: "service", id, state: s }),
  );

  const mainCtl = useMemo(() => new MapController(statusCb.current), []);
  const rightCtl = useMemo(() => {
    const c = new MapController((id, s) => statusCb.current(`right:${id}`, s));
    c.onSelect = null;
    return c;
  }, []);

  // Map click → selection (both maps select; only the main map zooms)
  useEffect(() => {
    const handler = (code: string | null) =>
      dispatch({ type: "select", code });
    mainCtl.onSelect = handler;
    rightCtl.onSelect = handler;
  }, [mainCtl, rightCtl, dispatch]);

  // Selection → highlight/zoom
  useEffect(() => {
    void mainCtl.select(selectedCode, true);
    if (pvpOpened) void rightCtl.select(selectedCode, false);
  }, [selectedCode, mainCtl, rightCtl, pvpOpened]);

  // Metric/format → choropleth renderer (main map only; right map is outline reference)
  useEffect(() => {
    mainCtl.setRenderer(metric, format);
  }, [metric, format, mainCtl]);

  // PvP lifecycle: mount second map once; style it as provision reference
  useEffect(() => {
    if (mode === "pvp" && !pvpOpened) setPvpOpened(true);
  }, [mode, pvpOpened]);
  useEffect(() => {
    if (!pvpOpened) return;
    const t = window.setInterval(() => {
      if (rightCtl.view) {
        window.clearInterval(t);
        rightCtl.useOutlineStyle();
        rightCtl.setBasemap(true);
        void rightCtl.select(selectedCode, false);
      }
    }, 120);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pvpOpened, rightCtl]);

  // Layer toggles: context layers live on the main map in Explore, and on the
  // provision map in PvP (the perception side stays a clean index canvas).
  useEffect(() => {
    LAYER_IDS.forEach((id) => {
      mainCtl.setLayerVisible(id, layers[id] && mode !== "pvp");
      if (pvpOpened) rightCtl.setLayerVisible(id, layers[id] && mode === "pvp");
    });
  }, [layers, mode, mainCtl, rightCtl, pvpOpened]);

  useEffect(() => {
    mainCtl.setBasemap(basemapOn && mode !== "pvp");
  }, [basemapOn, mode, mainCtl]);

  useViewSync(mainCtl, rightCtl, mode === "pvp");

  const provision = useProvision(mode === "pvp");

  return (
    <div className="app-frame">
      <Header />
      <main className="app-main">
        <div className={`map-stage ${mode === "pvp" ? "split" : ""}`}>
          <MapHost controller={mainCtl} label="Greenspace Index map of Northern Ireland">
            <CouncilLabels controller={mainCtl} visible={mode === "explore" || mode === "pvp"} />
          </MapHost>
          {pvpOpened && (
            <MapHost
              controller={rightCtl}
              label="Mapped greenspace provision"
              hidden={mode !== "pvp"}
            >
              <CouncilLabels controller={rightCtl} visible={mode === "pvp"} />
            </MapHost>
          )}
        </div>

        {mode === "explore" && (
          <>
            <IntegrityChip />
            <LeftPanel />
            <AreaPanel />
            <KpiStrip />
          </>
        )}

        {mode === "pvp" && (
          <>
            <PvpBanner />
            <PerceptionPanel />
            <ProvisionPanel provision={provision} />
          </>
        )}

        {mode === "understand" && <UnderstandOverlay />}
        {mode === "compare" && <CompareOverlay />}

        <AttributionChip />
      </main>
      <MethodologyModal />
      <AboutModal />
    </div>
  );
}
