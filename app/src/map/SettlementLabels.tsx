import { useEffect, useRef, useState } from "react";
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils";
import Point from "@arcgis/core/geometry/Point";
import SpatialReference from "@arcgis/core/geometry/SpatialReference";
import { geographicToWebMercator } from "@arcgis/core/geometry/support/webMercatorUtils";
import { localData } from "../config/services";
import type { MapController } from "./MapController";

interface LabelRow {
  n: string;
  pt: [number, number];
  t: number;
}

/** A settlement tier becomes labellable below this view scale. */
const TIER_SCALE: Record<number, number> = { 1: 700000, 2: 300000, 3: 150000, 4: 80000 };

/**
 * Named settlement labels (from the Area Plans development limits), shown at
 * a suitable scale per settlement size and culled to the viewport — the same
 * HTML-overlay approach as CouncilLabels.
 */
export function SettlementLabels({ controller, visible }: { controller: MapController; visible: boolean }) {
  const [anchors, setAnchors] = useState<{ n: string; t: number; pt: Point }[]>([]);
  const wrap = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (!visible || loaded.current) return;
    loaded.current = true;
    fetch(`${import.meta.env.BASE_URL}${localData.settlementLabels}`)
      .then((r) => r.json())
      .then((rows: LabelRow[]) =>
        setAnchors(
          rows.map((r) => ({
            n: r.n,
            t: r.t,
            pt: geographicToWebMercator(
              new Point({ longitude: r.pt[0], latitude: r.pt[1], spatialReference: SpatialReference.WGS84 }),
            ) as Point,
          })),
        ),
      )
      .catch(() => undefined);
  }, [visible]);

  useEffect(() => {
    const el = wrap.current;
    if (!el || anchors.length === 0) return;
    const update = () => {
      const view = controller.view;
      if (!view) return;
      const scale = view.scale;
      const ext = view.extent;
      const children = Array.from(el.children) as HTMLElement[];
      for (let i = 0; i < children.length; i++) {
        const a = anchors[i];
        const child = children[i];
        if (!a || !ext) continue;
        const show =
          scale < (TIER_SCALE[a.t] ?? 80000) &&
          a.pt.x > ext.xmin && a.pt.x < ext.xmax && a.pt.y > ext.ymin && a.pt.y < ext.ymax;
        if (!show) {
          child.style.display = "none";
          continue;
        }
        const s = view.toScreen(a.pt);
        if (!s) continue;
        child.style.display = "block";
        child.style.transform = `translate(-50%, -50%) translate(${s.x}px, ${s.y}px)`;
      }
    };
    update();
    const h = reactiveUtils.watch(
      () => [controller.view?.extent],
      () => requestAnimationFrame(update),
    );
    // also reposition when the view finishes an update cycle — without this,
    // labels placed before the first frame sit at the origin until a pan
    const h2 = reactiveUtils.watch(
      () => controller.view?.updating,
      (u) => {
        if (u === false) requestAnimationFrame(update);
      },
    );
    const t = window.setInterval(() => {
      if (controller.view) {
        window.clearInterval(t);
        update();
      }
    }, 250);
    return () => {
      h.remove();
      h2.remove();
      window.clearInterval(t);
    };
  }, [controller, anchors, visible]);

  return (
    <div
      ref={wrap}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 4,
        opacity: visible ? 1 : 0,
        transition: "opacity 200ms ease",
      }}
    >
      {anchors.map((a) => (
        <span
          key={a.n}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            display: "none",
            font: `500 ${a.t === 1 ? 10.5 : 9.5}px Manrope, sans-serif`,
            fontStyle: "italic",
            letterSpacing: "0.02em",
            color: "rgba(242,244,233,0.62)",
            textShadow: "0 1px 3px rgba(8,29,40,0.9)",
            whiteSpace: "nowrap",
          }}
        >
          {a.n}
        </span>
      ))}
    </div>
  );
}
