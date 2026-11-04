import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import type { FormatId, MetricId } from "../data";

export type Mode = "explore" | "understand" | "compare" | "pvp";

export type LayerId = "greenspace" | "trails" | "accessPoints" | "bluespace";
export type ServiceState = "idle" | "loading" | "ok" | "error";

export interface AppState {
  mode: Mode;
  metric: MetricId;
  format: FormatId;
  selectedCode: string | null;
  leftOpen: boolean;
  rightOpen: boolean;
  layers: Record<LayerId, boolean>;
  basemapOn: boolean;
  serviceStatus: Record<string, ServiceState>;
  infoOpen: boolean;
  methodologyOpen: boolean;
}

export type Action =
  | { type: "mode"; mode: Mode }
  | { type: "metric"; metric: MetricId }
  | { type: "format"; format: FormatId }
  | { type: "select"; code: string | null }
  | { type: "panel"; side: "left" | "right"; open: boolean }
  | { type: "layer"; layer: LayerId; on: boolean }
  | { type: "basemap"; on: boolean }
  | { type: "service"; id: string; state: ServiceState }
  | { type: "info"; open: boolean }
  | { type: "methodology"; open: boolean };

export const initialState: AppState = {
  mode: "explore",
  metric: "total",
  format: "pct",
  selectedCode: null,
  leftOpen: true,
  rightOpen: true,
  layers: { greenspace: false, trails: false, accessPoints: false, bluespace: false },
  basemapOn: false,
  serviceStatus: {},
  infoOpen: false,
  methodologyOpen: false,
};

export function reducer(state: AppState, a: Action): AppState {
  switch (a.type) {
    case "mode": {
      const next: AppState = { ...state, mode: a.mode };
      // Entering the signature mode turns the provision evidence on.
      if (a.mode === "pvp") {
        next.layers = { ...state.layers, greenspace: true, trails: true, accessPoints: true };
        next.basemapOn = true;
      }
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
      return { ...state, selectedCode: a.code, rightOpen: a.code ? true : state.rightOpen };
    case "panel":
      return a.side === "left"
        ? { ...state, leftOpen: a.open }
        : { ...state, rightOpen: a.open };
    case "layer":
      return { ...state, layers: { ...state.layers, [a.layer]: a.on } };
    case "basemap":
      return { ...state, basemapOn: a.on };
    case "service":
      return { ...state, serviceStatus: { ...state.serviceStatus, [a.id]: a.state } };
    case "info":
      return { ...state, infoOpen: a.open };
    case "methodology":
      return { ...state, methodologyOpen: a.open };
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
