import "@arcgis/map-components/components/arcgis-map";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { MapController } from "./MapController";

interface Props {
  controller: MapController;
  label: string;
  hidden?: boolean;
  children?: ReactNode;
}

/**
 * Thin React host for an <arcgis-map> web component. The element mounts once
 * and stays mounted for the life of the app (mode/panel changes never
 * reinitialise the view — the stage is resized with CSS only).
 */
export function MapHost({ controller, label, hidden, children }: Props) {
  const ref = useRef<HTMLArcgisMapElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onReady = () => {
      if (el.view && !controller.view) {
        controller.attach(el.view);
        // Hold the loading chip until the boundary layer has actually painted
        // (first paint can take several seconds; view-ready is too early).
        controller.whenFirstPaint().finally(() => setReady(true));
      }
    };
    el.addEventListener("arcgisViewReadyChange", onReady);
    if (el.view) onReady();
    return () => el.removeEventListener("arcgisViewReadyChange", onReady);
  }, [controller]);

  return (
    <div className="map-host" style={hidden ? { display: "none" } : undefined} role="application" aria-label={label}>
      <arcgis-map ref={ref} />
      {children}
      {!ready && <div className="map-loading glass-strong" style={{ position: "absolute", inset: "auto 50% 50% auto", translate: "50% 50%", padding: "10px 18px", borderRadius: 999 }}>PREPARING MAP…</div>}
    </div>
  );
}
