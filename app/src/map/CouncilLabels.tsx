import { useEffect, useRef, useState } from "react";
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils";
import Point from "@arcgis/core/geometry/Point";
import SpatialReference from "@arcgis/core/geometry/SpatialReference";
import type { MapController } from "./MapController";

/**
 * Council name labels as an HTML overlay (11 divs projected with view.toScreen)
 * — typographically consistent with the app and immune to SDK label quirks.
 */
export function CouncilLabels({ controller, visible }: { controller: MapController; visible: boolean }) {
  const [anchors, setAnchors] = useState<{ code: string; name: string; pt: Point }[]>([]);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let disposed = false;
    const t = window.setInterval(() => {
      const view = controller.view;
      if (!view || !view.ready) return;
      controller.lgdLayer
        .queryFeatures({
          where: "1=1",
          returnGeometry: true,
          outFields: ["code", "name"],
          outSpatialReference: SpatialReference.WebMercator,
        })
        .then((fs) => {
          if (disposed) return;
          setAnchors(
            fs.features.map((f) => {
              const ext = f.geometry!.extent!;
              return {
                code: f.attributes.code as string,
                name: f.attributes.name as string,
                pt: new Point({
                  x: (ext.xmin + ext.xmax) / 2,
                  y: (ext.ymin + ext.ymax) / 2,
                  spatialReference: ext.spatialReference,
                }),
              };
            }),
          );
        })
        .catch(() => undefined);
      window.clearInterval(t);
    }, 200);
    return () => {
      disposed = true;
      window.clearInterval(t);
    };
  }, [controller]);

  useEffect(() => {
    const view = controller.view;
    if (!view || anchors.length === 0) return;
    const el = wrap.current;
    if (!el) return;
    const update = () => {
      if (!controller.view) return;
      for (const child of Array.from(el.children) as HTMLElement[]) {
        const anchor = anchors.find((a) => a.code === child.dataset.code);
        if (!anchor) continue;
        const s = controller.view.toScreen(anchor.pt);
        if (!s) continue;
        child.style.transform = `translate(-50%, -50%) translate(${s.x}px, ${s.y}px)`;
      }
    };
    update();
    const h = reactiveUtils.watch(
      () => [controller.view?.extent],
      () => requestAnimationFrame(update),
    );
    return () => h.remove();
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
            font: "700 10px Manrope, sans-serif",
            letterSpacing: "0.04em",
            color: "rgba(242,244,233,0.85)",
            textShadow: "0 1px 3px rgba(8,29,40,0.95), 0 0 6px rgba(8,29,40,0.9)",
            whiteSpace: "nowrap",
            maxWidth: 150,
            textAlign: "center",
          }}
        >
          {a.name}
        </span>
      ))}
    </div>
  );
}
