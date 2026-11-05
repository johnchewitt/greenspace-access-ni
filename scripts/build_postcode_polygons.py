#!/usr/bin/env python3
"""Derive postcode district & sector polygons from licensed unit-postcode points.

Input (argv[1], not committed): the client-supplied, licence-cleared NSPL
(Nov 2020) BT unit postcodes, geocoded to Irish Grid (EPSG:29902), in a File
Geodatabase. The layer is POINTS — polygons are DERIVED here the way postcode
boundary products are commonly built: a Voronoi tessellation of the precise
unit-postcode locations, dissolved by district / sector, clipped to the NI
council-boundary outline. The result is an *indicative* boundary set and is
labelled as derived wherever shown.

Outputs (app/public/data/):
- pc_districts_joined.geojson — every derived district; published POMNI
  results joined where they exist (pub=1), with the same field names the
  council choropleth renderer uses.
- pc_sectors_joined.geojson — same, for sectors.

Join coverage over the published 48 districts + 23 sectors is asserted.
"""
import json
import re
import sys
from pathlib import Path

import numpy as np
import pyogrio
import shapely
from pyproj import Transformer
from scipy.spatial import Voronoi
from shapely.geometry import MultiPolygon, Polygon, box
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parent.parent
UNIT_RE = re.compile(r"^(BT\d+)\s+?(\d)([A-Z]{2})$")
SIMPLIFY_M = 40


def finite_voronoi_cells(vor: Voronoi, bound: Polygon) -> list[Polygon | None]:
    """Finite polygon per input point, clipped to `bound` (standard recipe)."""
    center = vor.points.mean(axis=0)
    radius = 1e6
    # map point -> ridges
    all_ridges: dict[int, list] = {}
    for (p1, p2), (v1, v2) in zip(vor.ridge_points, vor.ridge_vertices):
        all_ridges.setdefault(p1, []).append((p2, v1, v2))
        all_ridges.setdefault(p2, []).append((p1, v1, v2))
    cells: list[Polygon | None] = []
    for p1, region_idx in enumerate(vor.point_region):
        vertices = vor.regions[region_idx]
        if -1 not in vertices:
            poly = Polygon(vor.vertices[vertices])
        else:
            ridges = all_ridges.get(p1, [])
            new_region = [v for v in vertices if v >= 0]
            pts = [vor.vertices[v] for v in new_region]
            for p2, v1, v2 in ridges:
                if v2 < 0:
                    v1, v2 = v2, v1
                if v1 >= 0:
                    continue
                t = vor.points[p2] - vor.points[p1]
                t /= np.linalg.norm(t)
                n = np.array([-t[1], t[0]])
                midpoint = vor.points[[p1, p2]].mean(axis=0)
                direction = np.sign(np.dot(midpoint - center, n)) * n
                pts.append(vor.vertices[v2] + direction * radius)
            if len(pts) < 3:
                cells.append(None)
                continue
            arr = np.array(pts)
            c = arr.mean(axis=0)
            ang = np.arctan2(arr[:, 1] - c[1], arr[:, 0] - c[0])
            poly = Polygon(arr[np.argsort(ang)])
        poly = poly.buffer(0)
        cells.append(poly if not poly.is_empty else None)
    return cells


def main() -> None:
    src = Path(sys.argv[1])
    meta, _, geoms, fields = pyogrio.raw.read(
        src, columns=["USER_pcd", "Status", "ShortLabel"], force_2d=True
    )
    idx = {n: i for i, n in enumerate(meta["fields"])}
    pcd_a, status_a, short_a = (
        fields[idx["USER_pcd"]],
        fields[idx["Status"]],
        fields[idx["ShortLabel"]],
    )
    pts_geom = shapely.from_wkb(geoms)

    by_xy: dict[tuple[float, float], tuple[str, str]] = {}
    for g, pcd, status, short in zip(pts_geom, pcd_a, status_a, short_a):
        if g is None or status != "M":
            continue
        # NSPL pcd is 7 chars with the inward code as the last 3 ("BT1  1AA",
        # "BT111AA"); outward = the rest, stripped.
        raw = str(pcd or "").strip()
        if len(raw) < 5:
            continue
        inward, outward = raw[-3:], raw[:-3].strip()
        if not re.match(r"^BT\d+$", outward) or not re.match(r"^\d[A-Z]{2}$", inward):
            continue
        # require the geocode itself to be a precise unit-level match
        if not UNIT_RE.match(str(short or "").strip()):
            continue
        key = (round(g.x, 1), round(g.y, 1))
        if key not in by_xy:
            by_xy[key] = (outward, f"{outward} {inward[0]}")

    coords = np.array(list(by_xy.keys()))
    codes = list(by_xy.values())
    print(f"unit points for tessellation: {len(coords)}")

    # NI outline from the bundled council boundaries (WGS84 -> Irish Grid)
    lgd = json.loads((ROOT / "app/public/data/ni_lgd_joined.geojson").read_text())
    tr_in = Transformer.from_crs(4326, 29902, always_xy=True)
    polys = []
    for f in lgd["features"]:
        geom = shapely.geometry.shape(f["geometry"])
        polys.append(shapely.transform(geom, lambda a: np.column_stack(tr_in.transform(a[:, 0], a[:, 1]))))
    outline = unary_union(polys).buffer(100).buffer(0)

    vor = Voronoi(coords)
    bound = box(*outline.bounds).buffer(5000)
    cells = finite_voronoi_cells(vor, bound)

    by_district: dict[str, list] = {}
    by_sector: dict[str, list] = {}
    for cell, (district, sector) in zip(cells, codes):
        if cell is None:
            continue
        by_district.setdefault(district, []).append(cell)
        by_sector.setdefault(sector, []).append(cell)

    districts_pub = {r["postcode_area"]: r for r in json.loads((ROOT / "data/postcode_area_results.json").read_text())}
    sectors_pub = {r["postcode_sector"]: r for r in json.loads((ROOT / "data/postcode_sector_results.json").read_text())}

    tr_out = Transformer.from_crs(29902, 4326, always_xy=True)

    def dissolve(groups: dict[str, list], pub: dict[str, dict], code_key: str) -> dict:
        feats = []
        covered = set()
        for code, cell_list in sorted(groups.items()):
            geom = unary_union(cell_list).intersection(outline)
            geom = geom.simplify(SIMPLIFY_M, preserve_topology=True).buffer(0)
            if geom.is_empty:
                continue
            if isinstance(geom, Polygon):
                geom = MultiPolygon([geom])
            # drop slivers under 2 ha so coastline clips stay clean
            parts = [p for p in geom.geoms if p.area > 20000] or list(geom.geoms)
            geom = MultiPolygon(parts)
            wgs = shapely.transform(geom, lambda a: np.column_stack(tr_out.transform(a[:, 0], a[:, 1])))
            gj = json.loads(json.dumps(wgs.__geo_interface__), parse_float=lambda v: round(float(v), 5))
            row = pub.get(code)
            # every field present on every feature (null when unpublished):
            # GeoJSONLayer infers its schema from leading features, so a file
            # whose first features lack a field would lose it for ALL features
            props: dict = {
                "code": code, "pub": 1 if row else 0, "name": None, "n": None,
                "total_pct": None, "total_index": None,
                "idx_at": None, "idx_aw": None, "idx_q": None, "idx_b": None,
            }
            if row:
                covered.add(code)
                t = row["themes_index"]
                props.update(
                    name=row["place"], n=row["sample_n"],
                    total_pct=row["total_pct"], total_index=row["total_index"],
                    idx_at=t["access_to"], idx_aw=t["access_within"],
                    idx_q=t["quality"], idx_b=t["benefits"],
                )
            feats.append({"type": "Feature", "properties": props, "geometry": gj})
        missing = set(pub) - covered
        if missing:
            sys.exit(f"FATAL: published {code_key} without polygons: {sorted(missing)}")
        return {"type": "FeatureCollection", "features": feats}

    d_fc = dissolve(by_district, districts_pub, "districts")
    s_fc = dissolve(by_sector, sectors_pub, "sectors")
    dd = ROOT / "app/public/data/pc_districts_joined.geojson"
    sd = ROOT / "app/public/data/pc_sectors_joined.geojson"
    dd.write_text(json.dumps(d_fc, separators=(",", ":")))
    sd.write_text(json.dumps(s_fc, separators=(",", ":")))
    print(
        f"OK: {len(d_fc['features'])} districts ({dd.stat().st_size//1024} KiB), "
        f"{len(s_fc['features'])} sectors ({sd.stat().st_size//1024} KiB); "
        f"published joins: {sum(f['properties']['pub'] for f in d_fc['features'])}/48 districts, "
        f"{sum(f['properties']['pub'] for f in s_fc['features'])}/23 sectors"
    )


if __name__ == "__main__":
    main()
