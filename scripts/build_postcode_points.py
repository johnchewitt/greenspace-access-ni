#!/usr/bin/env python3
"""Build postcode reference points for the published POMNI postcode geographies.

Input: a client-supplied GeoJSON of geocoded NI unit-postcode points
(Northern_Ireland_Postcodes.geojson — not committed to the repo; supply its
path as argv[1]). Points are geocoder output; only precise, matched,
unit-level results (Status == 'M', ShortLabel like 'BT1 1AA') are used.

Output: app/public/data/postcode_points.json — one robust reference point
(median of member unit-postcode points) for each postcode district and sector
that has published POMNI results. These are LABEL ANCHORS for chart-on-map
markers, NOT boundaries: no polygon is derived or drawn, per the project's
GIS rules (no approximate postcode boundaries).

Every published unit must resolve; the script fails loudly otherwise.
"""
import json
import re
import statistics
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
UNIT_RE = re.compile(r"^(BT\d+) (\d)[A-Z]{2}$")


def main() -> None:
    src = Path(sys.argv[1])
    data = json.loads(src.read_text())

    by_district: dict[str, list[tuple[float, float]]] = {}
    by_sector: dict[str, list[tuple[float, float]]] = {}
    for f in data["features"]:
        p = f["properties"]
        if p.get("Status") != "M":
            continue
        m = UNIT_RE.match(p.get("ShortLabel") or "")
        if not m:
            continue  # sector-level fallback matches and junk are excluded
        lon, lat = f["geometry"]["coordinates"][:2]
        district = m.group(1)
        sector = f"{m.group(1)} {m.group(2)}"
        by_district.setdefault(district, []).append((lon, lat))
        by_sector.setdefault(sector, []).append((lon, lat))

    def median_point(pts: list[tuple[float, float]]) -> list[float]:
        return [
            round(statistics.median(x for x, _ in pts), 5),
            round(statistics.median(y for _, y in pts), 5),
        ]

    districts_pub = json.loads((ROOT / "data/postcode_area_results.json").read_text())
    sectors_pub = json.loads((ROOT / "data/postcode_sector_results.json").read_text())

    out = {"source_points": sum(len(v) for v in by_district.values()), "districts": {}, "sectors": {}}
    missing: list[str] = []
    for row in districts_pub:
        code = row["postcode_area"]
        pts = by_district.get(code)
        if not pts:
            missing.append(code)
            continue
        out["districts"][code] = {"pt": median_point(pts), "n_units": len(pts)}
    for row in sectors_pub:
        code = row["postcode_sector"]
        pts = by_sector.get(code)
        if not pts:
            missing.append(code)
            continue
        out["sectors"][code] = {"pt": median_point(pts), "n_units": len(pts)}

    if missing:
        sys.exit(f"FATAL: no unit-postcode points for published units: {missing}")

    dest = ROOT / "app/public/data/postcode_points.json"
    dest.write_text(json.dumps(out, separators=(",", ":")))
    print(
        f"OK: {len(out['districts'])} districts, {len(out['sectors'])} sectors "
        f"from {out['source_points']} unit points -> {dest}"
    )


if __name__ == "__main__":
    main()
