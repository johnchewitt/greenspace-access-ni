import { useEffect } from "react";
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils";
import type { MapController } from "./MapController";

/** Keep two MapViews geographically synchronised (either can lead). */
export function useViewSync(a: MapController, b: MapController, active: boolean) {
  useEffect(() => {
    if (!active) return;
    let guard = false;
    const handles: { remove(): void }[] = [];
    const link = (lead: MapController, follow: MapController) => {
      handles.push(
        reactiveUtils.watch(
          () => lead.view?.viewpoint,
          (vp) => {
            if (guard || !vp || !follow.view || !lead.view) return;
            guard = true;
            follow.view.viewpoint = vp.clone();
            requestAnimationFrame(() => (guard = false));
          },
        ),
      );
    };
    // Wait until both views are fully ready (second map mounts lazily)
    const timer = window.setInterval(() => {
      if (a.view?.ready && b.view?.ready) {
        window.clearInterval(timer);
        guard = true;
        b.view.viewpoint = a.view.viewpoint.clone();
        requestAnimationFrame(() => (guard = false));
        link(a, b);
        link(b, a);
      }
    }, 150);
    return () => {
      window.clearInterval(timer);
      handles.forEach((h) => h.remove());
    };
  }, [a, b, active]);
}
