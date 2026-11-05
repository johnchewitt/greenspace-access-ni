import { useEffect, useMemo, useRef } from "react";
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils";
import Point from "@arcgis/core/geometry/Point";
import SpatialReference from "@arcgis/core/geometry/SpatialReference";
import { geographicToWebMercator } from "@arcgis/core/geometry/support/webMercatorUtils";
import type { MapController, PostcodePointRow } from "./MapController";

/**
 * Postcode code labels as an HTML overlay beside the result markers —
 * same approach as CouncilLabels (projected with view.toScreen).
 */
export function PostcodeLabels({
  controller,
  rows,
  kind,
  visible,
}: {
  controller: MapController;
  rows: PostcodePointRow[] | null;
  kind: "districts" | "sectors";
  visible: boolean;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const anchors = useMemo(
    () =>
      (rows ?? [])
        .filter((r) => r.kind === kind)
        .map((r) => ({
          code: r.code,
          pt: geographicToWebMercator(
            new Point({ longitude: r.lon, latitude: r.lat, spatialReference: SpatialReference.WGS84 }),
          ) as Point,
        })),
    [rows, kind],
  );

  useEffect(() => {
    const el = wrap.current;
    if (!el || anchors.length === 0) return;
    const update = () => {
      if (!controller.view) return;
      for (const child of Array.from(el.children) as HTMLElement[]) {
        const anchor = anchors.find((a) => a.code === child.dataset.code);
        if (!anchor) continue;
        const s = controller.view.toScreen(anchor.pt);
        if (!s) continue;
        // sit just below the marker
        child.style.transform = `translate(-50%, 7px) translate(${s.x}px, ${s.y}px)`;
      }
    };
    update();
    const t = window.setInterval(() => {
      if (controller.view) {
        window.clearInterval(t);
        update();
      }
    }, 200);
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
    return () => {
      window.clearInterval(t);
      h.remove();
      h2.remove();
    };
  }, [controller, anchors]);

  return (
    <div
      ref={wrap}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 5,
        opacity: visible ? 1 : 0,
        transition: "opacity 200ms ease",
      }}
    >
      {anchors.map((a) => (
        <span
          key={a.code}
          data-code={a.code}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            font: "700 9.5px Manrope, sans-serif",
            letterSpacing: "0.03em",
            color: "rgba(242,244,233,0.8)",
            textShadow: "0 1px 3px rgba(8,29,40,0.95), 0 0 6px rgba(8,29,40,0.9)",
            whiteSpace: "nowrap",
          }}
        >
          {a.code}
        </span>
      ))}
    </div>
  );
}
