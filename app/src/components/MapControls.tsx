import type { MapController } from "../map/MapController";
import { useAppDispatch } from "../state/AppState";

/** Floating map utilities — reset the view to the NI home extent. */
export function MapControls({ controller }: { controller: MapController }) {
  const dispatch = useAppDispatch();
  return (
    <div className="map-controls">
      <button
        className="icon-btn"
        title="Reset the view — zoom back out to Northern Ireland and clear the selection"
        aria-label="Reset map view"
        onClick={() => {
          dispatch({ type: "select", code: null });
          dispatch({ type: "emphasize", codes: null });
          // Also rehome directly: state may already be empty after a manual pan.
          void controller.select(null, true);
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5.5 9.5V20h13V9.5" />
        </svg>
      </button>
    </div>
  );
}
