import { useEffect, useMemo } from "react";
import { Header } from "./components/Header";
import { AboutModal, AttributionChip, MethodologyModal } from "./components/Modals";
import { MapControls } from "./components/MapControls";
import { Tour, tourAlreadySeen } from "./components/Tour";
import { IntegrityChip } from "./components/shared";
import { AreaPanel, KpiStrip, LeftPanel } from "./features/explore/ExplorePanels";
import { AboutMode } from "./features/about/AboutMode";
import { AccessPanel } from "./features/access/AccessMode";
import { InsightsHub } from "./features/insights/InsightsHub";
import { OverviewMode } from "./features/overview/OverviewMode";
import { ReportModal } from "./features/report/ReportModal";
import { StoryMode } from "./features/story/StoryMode";
import { UnderstandOverlay } from "./features/understand/UnderstandOverlay";
import {
  PerceptionPanel,
  ProvisionPanel,
  PvpBanner,
  useNIProvision,
  useProvision,
} from "./features/pvp/PvpMode";
import { EvidenceDrawer } from "./features/pvp/EvidenceDrawer";
import { MapHost } from "./map/MapHost";
import { CouncilLabels } from "./map/CouncilLabels";
import { MapTooltip } from "./map/MapTooltip";
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
  const { mode, metric, format, selectedCode, layers, basemap, sdzOn, sdzField, emphasizedCodes, pvpOpened, pendingSdzZoom } = state;

  // dispatch from useReducer is stable, so both controllers are created once.
  const mainCtl = useMemo(
    () =>
      new MapController((id, s) => dispatch({ type: "service", id, state: s })),
    [dispatch],
  );
  const rightCtl = useMemo(
    () =>
      new MapController((id, s) =>
        dispatch({ type: "service", id: `right:${id}`, state: s }),
      ),
    [dispatch],
  );

  // First visit → offer the quick tour once (storage failures mean "seen").
  useEffect(() => {
    if (!tourAlreadySeen()) dispatch({ type: "tour", step: 0 });
  }, [dispatch]);

  // Map click → selection (both maps select; only the main map zooms)
  useEffect(() => {
    const handler = (code: string | null) => dispatch({ type: "select", code });
    mainCtl.setOnSelect(handler);
    rightCtl.setOnSelect(handler);
    return () => {
      mainCtl.setOnSelect(null);
      rightCtl.setOnSelect(null);
    };
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

  // PvP lifecycle: second map mounts on first entry; style it as provision reference
  useEffect(() => {
    if (!pvpOpened) return;
    const t = window.setInterval(() => {
      if (rightCtl.view) {
        window.clearInterval(t);
        rightCtl.useOutlineStyle();
        rightCtl.setBasemap("streets");
        void rightCtl.select(selectedCode, false);
      }
    }, 120);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pvpOpened, rightCtl]);

  // Layer toggles: context layers live on the main map in Explore/Accessibility,
  // and on the provision map in PvP (the perception side stays a clean canvas).
  useEffect(() => {
    LAYER_IDS.forEach((id) => {
      mainCtl.setLayerVisible(id, layers[id] && mode !== "pvp");
      if (pvpOpened) rightCtl.setLayerVisible(id, layers[id] && mode === "pvp");
    });
  }, [layers, mode, mainCtl, rightCtl, pvpOpened]);

  useEffect(() => {
    mainCtl.setBasemap(basemap);
  }, [basemap, mainCtl]);

  // The SDZ household-proximity surface: on the provision map in PvP, and on
  // the main map in the Accessibility explorer (where the choropleth hides so
  // the two surfaces never stack).
  useEffect(() => {
    if (pvpOpened) rightCtl.setSdz(sdzOn && mode === "pvp");
    mainCtl.setSdz(sdzOn && mode === "access");
    // In the Accessibility explorer the choropleth hides so the perception and
    // provision surfaces never stack. Story mode choreographs its own
    // choropleth per chapter — leave it alone (single writer).
    if (mode !== "story") mainCtl.setChoroplethVisible(mode !== "access");
  }, [sdzOn, mode, pvpOpened, rightCtl, mainCtl]);

  useEffect(() => {
    if (pvpOpened) rightCtl.setSdzField(sdzField);
    mainCtl.setSdzField(sdzField);
  }, [sdzField, pvpOpened, rightCtl, mainCtl]);

  // One-shot zoom to a Super Data Zone (from the opportunity explorer)
  useEffect(() => {
    if (!pendingSdzZoom || mode !== "access") return;
    let cancelled = false;
    const t = window.setInterval(() => {
      if (cancelled) return;
      if (mainCtl.view) {
        window.clearInterval(t);
        void mainCtl.zoomToSdz(pendingSdzZoom).then(() => {
          if (!cancelled) dispatch({ type: "zoomSdz", code: null });
        });
      }
    }, 150);
    return () => {
      cancelled = true;
      window.clearInterval(t);
    };
  }, [pendingSdzZoom, mode, mainCtl, dispatch]);

  // Quadrant emphasis fades non-matching councils; single selection wins.
  useEffect(() => {
    if (selectedCode) return; // select() already applied its own effect
    void mainCtl.emphasize(emphasizedCodes);
    if (pvpOpened) void rightCtl.emphasize(emphasizedCodes);
  }, [emphasizedCodes, selectedCode, mainCtl, rightCtl, pvpOpened]);

  useViewSync(mainCtl, rightCtl, mode === "pvp");

  const provisionActive =
    mode === "pvp" || mode === "insights" || mode === "overview" || state.reportOpen;
  const provision = useProvision(provisionActive);
  const niProvision = useNIProvision(
    provisionActive || mode === "access" || mode === "story",
  );

  return (
    <div className="app-frame">
      <Header />
      <main className="app-main">
        <div className={`map-stage ${mode === "pvp" ? "split" : ""}`}>
          <MapHost controller={mainCtl} label="Greenspace Index map of Northern Ireland">
            <CouncilLabels controller={mainCtl} visible={mode === "explore" || mode === "pvp" || mode === "story"} />
            <MapTooltip controller={mainCtl} />
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

        {mode === "overview" && (
          <OverviewMode provision={provision} niProvision={niProvision} />
        )}

        {mode === "explore" && (
          <>
            <IntegrityChip />
            <LeftPanel />
            <AreaPanel />
            <KpiStrip />
          </>
        )}

        {mode === "access" && <AccessPanel niProvision={niProvision} />}

        {mode === "pvp" && (
          <>
            <PvpBanner />
            <PerceptionPanel />
            <ProvisionPanel provision={provision} niProvision={niProvision} />
            <EvidenceDrawer
              provisionByCode={provision.status === "ok" ? provision.byCode : null}
              niProvisionRef={niProvision?.pct400 ?? null}
              vintage={niProvision?.year ?? null}
            />
          </>
        )}

        {mode === "understand" && <UnderstandOverlay />}
        {mode === "insights" && (
          <InsightsHub provision={provision} niProvision={niProvision} />
        )}
        {mode === "story" && <StoryMode controller={mainCtl} niProvision={niProvision} />}
        {mode === "about" && <AboutMode />}

        {(mode === "explore" || mode === "access" || mode === "pvp") && (
          <MapControls controller={mainCtl} />
        )}

        <AttributionChip />
      </main>
      <MethodologyModal />
      <AboutModal />
      <Tour />
      <ReportModal controller={mainCtl} provision={provision} niProvision={niProvision} />
    </div>
  );
}
