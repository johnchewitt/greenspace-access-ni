#!/usr/bin/env python3
"""Prepare NI Planning Settlement Development Limits for bundling, with names.

Input (argv[1], not committed): client-supplied Esri JSON export of the
published settlement development limits from the statutory Area Plans
(TYPE_NAME 'DEVELOPMENT LIMIT'; LOCATION carries the settlement name;
Irish Grid, EPSG:29902). This supersedes the unnamed OSNI 50k footprints.

Outputs:
- app/public/data/osni_settlements.json — GeoJSON polygons (WGS84, lightly
  simplified, 5 dp) with properties {name, t} where t is a size tier
  (1 = largest quartile by area … 4 = smallest), used for symbol weight and
  label scale-gating.
- app/public/data/settlement_labels.json — one label anchor per feature:
  [{n, pt: [lon, lat], t}] (representative point, guaranteed inside).

Names are shown as supplied (title-cased for display); nothing is merged,
renamed or invented.
"""
import json
import sys
from pathlib import Path

from pyproj import Transformer
from shapely.geometry import MultiPolygon, Polygon
from shapely.ops import transform as shp_transform

ROOT = Path(__file__).resolve().parent.parent
SIMPLIFY_M = 15  # metres, in the projected CRS — gentle; limits stay faithful


def title_case(name: str) -> str:
    small = {"of", "and", "the"}
    out = []
    for i, w in enumerate(name.lower().split()):
        parts = [
            (p if (p in small and i > 0) else p.capitalize()) for p in w.split("/")
        ]
        # keep possessives and hyphens sensible
        out.append("/".join("-".join(x.capitalize() for x in p.split("-")) if "-" in p else p for p in parts))
    return " ".join(out)


def main() -> None:
    src = json.loads(Path(sys.argv[1]).read_text())
    assert src["spatialReference"]["latestWkid"] == 29902, src["spatialReference"]
    tr = Transformer.from_crs(29902, 4326, always_xy=True)

    rows = []
    for f in src["features"]:
        name = title_case(str(f["attributes"]["LOCATION"]).strip())
        rings = f["geometry"]["rings"]
        # Esri rings: treat the largest as shell and the rest as holes of a
        # single polygon when nested; robust enough: build polygons per ring
        # orientation-agnostically via buffer(0) fix-up.
        poly = MultiPolygon([Polygon(r) for r in rings if len(r) >= 4]).buffer(0)
        poly = poly.simplify(SIMPLIFY_M, preserve_topology=True)
        if poly.is_empty:
            continue
        rows.append((name, poly))

    feats = []
    areas = sorted((p.area for _, p in rows), reverse=True)
    q = [areas[len(areas) // 4], areas[len(areas) // 2], areas[3 * len(areas) // 4]]

    def tier(a: float) -> int:
        return 1 if a >= q[0] else 2 if a >= q[1] else 3 if a >= q[2] else 4

    def to_wgs(geom):
        return shp_transform(lambda x, y, z=None: tr.transform(x, y), geom)

    best_label: dict[str, tuple[float, dict]] = {}
    for name, poly in rows:
        t = tier(poly.area)
        g = to_wgs(poly)
        gj = json.loads(json.dumps(g.__geo_interface__), parse_float=lambda v: round(float(v), 5))
        feats.append({"type": "Feature", "properties": {"name": name, "t": t}, "geometry": gj})
        rp = to_wgs(poly.representative_point())
        lab = {"n": name, "pt": [round(rp.x, 5), round(rp.y, 5)], "t": t}
        # one label per settlement name — anchored on its largest part
        if name not in best_label or poly.area > best_label[name][0]:
            best_label[name] = (poly.area, lab)
    labels = [lab for _, lab in best_label.values()]

    out = {"type": "FeatureCollection", "features": feats}
    dest = ROOT / "app/public/data/osni_settlements.json"
    dest.write_text(json.dumps(out, separators=(",", ":")))
    ldest = ROOT / "app/public/data/settlement_labels.json"
    ldest.write_text(json.dumps(labels, separators=(",", ":")))
    print(
        f"OK: {len(feats)} settlement limits -> {dest} ({dest.stat().st_size // 1024} KiB); "
        f"{len(labels)} labels -> {ldest} ({ldest.stat().st_size // 1024} KiB)"
    )


if __name__ == "__main__":
    main()
