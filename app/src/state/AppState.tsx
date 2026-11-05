import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import type { FormatId, MetricId } from "../data";

export type Mode =
  | "overview"
  | "explore"
  | "understand"
  | "access"
  | "insights"
  | "pvp"
  | "story"
  | "about";

export type InsightsTab = "dashboard" | "compare" | "opportunities";

export type LayerId = "greenspace" | "trails" | "accessPoints" | "bluespace";
export type BasemapStyle = "none" | "dark" | "streets";
export type SdzField = "Percent400" | "Percent1km" | "Percent2km";
export type ServiceState = "idle" | "loading" | "ok" | "error";

export interface AppState {
  mode: Mode;
  /** true once the PvP split has been opened (second map stays mounted after) */
  pvpOpened: boolean;
  metric: MetricId;
  format: FormatId;
  selectedCode: string | null;
  leftOpen: boolean;
  rightOpen: boolean;
  layers: Record<LayerId, boolean>;
  basemap: BasemapStyle;
  sdzOn: boolean;
  sdzField: SdzField;
  /** councils emphasised on the maps (quadrant filtering); null = none */
  emphasizedCodes: string[] | null;
  serviceStatus: Record<string, ServiceState>;
  infoOpen: boolean;
  methodologyOpen: boolean;
  insightsTab: InsightsTab;
  reportOpen: boolean;
  tourStep: number | null;
  /** one-shot request to zoom the map to a Super Data Zone */
  pendingSdzZoom: string | null;
}

export type Action =
  | { type: "mode"; mode: Mode }
  | { type: "metric"; metric: MetricId }
  | { type: "format"; format: FormatId }
  | { type: "select"; code: string | null }
  | { type: "panel"; side: "left" | "right"; open: boolean }
  | { type: "layer"; layer: LayerId; on: boolean }
  | { type: "basemap"; style: BasemapStyle }
  | { type: "sdz"; on: boolean }
  | { type: "sdzField"; field: SdzField }
  | { type: "emphasize"; codes: string[] | null }
  | { type: "service"; id: string; state: ServiceState }
  | { type: "info"; open: boolean }
  | { type: "methodology"; open: boolean }
  | { type: "insightsTab"; tab: InsightsTab }
  | { type: "report"; open: boolean }
  | { type: "tour"; step: number | null }
  | { type: "zoomSdz"; code: string | null };

export const initialState: AppState = {
  mode: "overview",
  pvpOpened: false,
  metric: "total",
  format: "pct",
  selectedCode: null,
  leftOpen: true,
  rightOpen: true,
  layers: { greenspace: false, trails: false, accessPoints: false, bluespace: false },
  basemap: "dark",
  sdzOn: false,
  sdzField: "Percent400",
  emphasizedCodes: null,
  serviceStatus: {},
  infoOpen: false,
  methodologyOpen: false,
  insightsTab: "dashboard",
  reportOpen: false,
  tourStep: null,
  pendingSdzZoom: null,
};

export function reducer(state: AppState, a: Action): AppState {
  switch (a.type) {
    case "mode": {
      const next: AppState = { ...state, mode: a.mode, pvpOpened: state.pvpOpened || a.mode === "pvp" };
      // Entering the signature mode turns the provision evidence on.
      // (The provision map manages its own basemap; the index map keeps the
      // user's backdrop choice.)
      if (a.mode === "pvp") {
        next.layers = { ...state.layers, greenspace: true, trails: true, accessPoints: true };
      } else {
        next.emphasizedCodes = null;
      }
      // The Accessibility explorer's whole point is the household-proximity
      // surface, so entering it turns the surface on.
      if (a.mode === "access") next.sdzOn = true;
      return next;
    }
    case "metric": {
      // Theme scores by council are published as indices only — switching to a
      // theme while in % view moves honestly to the index view (never derived).
      const format = a.metric !== "total" ? "index" : state.format;
      return { ...state, metric: a.metric, format };
    }
    case "format":
      return { ...state, format: a.format };
    case "select":
      return {
        ...state,
        selectedCode: a.code,
        emphasizedCodes: null,
        rightOpen: a.code ? true : state.rightOpen,
      };
    case "panel":
      return a.side === "left"
        ? { ...state, leftOpen: a.open }
        : { ...state, rightOpen: a.open };
    case "layer":
      return { ...state, layers: { ...state.layers, [a.layer]: a.on } };
    case "basemap":
      return { ...state, basemap: a.style };
    case "sdz":
      return { ...state, sdzOn: a.on };
    case "sdzField":
      return { ...state, sdzField: a.field };
    case "emphasize":
      return { ...state, emphasizedCodes: a.codes };
    case "service":
      return { ...state, serviceStatus: { ...state.serviceStatus, [a.id]: a.state } };
    case "info":
      return { ...state, infoOpen: a.open };
    case "methodology":
      return { ...state, methodologyOpen: a.open };
    case "insightsTab":
      return { ...state, insightsTab: a.tab };
    case "report":
      return { ...state, reportOpen: a.open };
    case "tour":
      return { ...state, tourStep: a.step };
    case "zoomSdz":
      return { ...state, pendingSdzZoom: a.code };
  }
}

const StateCtx = createContext<AppState>(initialState);
const DispatchCtx = createContext<Dispatch<Action>>(() => {});

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const stateValue = useMemo(() => state, [state]);
  return (
    <StateCtx.Provider value={stateValue}>
      <DispatchCtx.Provider value={dispatch}>{children}</DispatchCtx.Provider>
    </StateCtx.Provider>
  );
}

export const useAppState = () => useContext(StateCtx);
export const useAppDispatch = () => useContext(DispatchCtx);
