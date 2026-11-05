import { useEffect, useRef, useState } from "react";
import { localData } from "../../config/services";
import { postcodeAreas, postcodeSectors } from "../../data";
import type { PostcodePointRow } from "../../map/MapController";

interface PointsFile {
  districts: Record<string, { pt: [number, number]; n_units: number }>;
  sectors: Record<string, { pt: [number, number]; n_units: number }>;
}

/**
 * Published postcode results joined to their bundled reference points
 * (median of geocoded unit postcodes — label anchors, never boundaries).
 * Loaded once, on first entry to a postcode geography.
 */
export function usePostcodePoints(active: boolean): PostcodePointRow[] | null {
  const [rows, setRows] = useState<PostcodePointRow[] | null>(null);
  const attempted = useRef(false);
  useEffect(() => {
    if (!active || rows || attempted.current) return;
    attempted.current = true;
    fetch(`${import.meta.env.BASE_URL}${localData.postcodePoints}`)
      .then((r) => r.json())
      .then((pts: PointsFile) => {
        const out: PostcodePointRow[] = [];
        for (const r of postcodeAreas) {
          const p = pts.districts[r.postcode_area];
          if (!p) continue; // join coverage is asserted by tests at build time
          out.push({
            kind: "districts",
            code: r.postcode_area,
            place: r.place,
            lon: p.pt[0],
            lat: p.pt[1],
            n: r.sample_n,
            total_pct: r.total_pct,
            total_index: r.total_index,
            idx_at: r.themes_index.access_to,
            idx_aw: r.themes_index.access_within,
            idx_q: r.themes_index.quality,
            idx_b: r.themes_index.benefits,
          });
        }
        for (const r of postcodeSectors) {
          const p = pts.sectors[r.postcode_sector];
          if (!p) continue;
          out.push({
            kind: "sectors",
            code: r.postcode_sector,
            place: r.place,
            lon: p.pt[0],
            lat: p.pt[1],
            n: r.sample_n,
            total_pct: r.total_pct,
            total_index: r.total_index,
            idx_at: r.themes_index.access_to,
            idx_aw: r.themes_index.access_within,
            idx_q: r.themes_index.quality,
            idx_b: r.themes_index.benefits,
          });
        }
        setRows(out);
      })
      .catch(() => setRows([]));
  }, [active, rows]);
  return rows;
}
