import { useEffect, useState } from "react";
import type { MapController } from "./MapController";
import { useAppState } from "../state/AppState";
import { LGD_DISPLAY, lgdByCode, fmtPct1, fmtIndex } from "../data";
import { THEME_SHORT } from "../data";

/** Cursor-following tooltip for the index choropleth (Explore mode). */
export function MapTooltip({ controller }: { controller: MapController }) {
  const { metric, format, mode } = useAppState();
  const [state, setState] = useState<{ code: string; x: number; y: number } | null>(null);

  useEffect(() => {
    controller.setOnHover((code, x, y) => setState(code ? { code, x, y } : null));
    return () => controller.setOnHover(null);
  }, [controller]);

  if (mode !== "explore" || !state) return null;
  const r = lgdByCode[state.code];
  if (!r) return null;

  const useIndex = metric !== "total" || format === "index";
  const value =
    metric === "total"
      ? useIndex
        ? fmtIndex(r.total_index)
        : fmtPct1(r.total_pct)
      : `${r.themes_index[metric]}`;

  return (
    <div
      className="glass-strong"
      role="tooltip"
      style={{
        position: "absolute",
        left: Math.min(state.x + 16, window.innerWidth - 230),
        top: state.y + 14,
        zIndex: 30,
        padding: "8px 12px",
        borderRadius: 12,
        pointerEvents: "none",
        maxWidth: 220,
      }}
    >
      <div style={{ font: "700 12px var(--gani-font-ui)", color: "var(--gani-cream)" }}>
        {LGD_DISPLAY[state.code]}
      </div>
      <div style={{ font: "600 11px var(--gani-font-ui)", color: "var(--gani-turquoise)" }}>
        {THEME_SHORT[metric]}: {value}
        <span style={{ color: "var(--gani-ink-3)", fontWeight: 500 }}>
          {useIndex ? " · NI = 100" : " of maximum"}
        </span>
      </div>
      <div style={{ fontSize: 10, color: "var(--gani-ink-3)", marginTop: 2 }}>
        Click for the full profile
      </div>
    </div>
  );
}
