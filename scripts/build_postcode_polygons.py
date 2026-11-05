#!/usr/bin/env python3
"""Build postcode district & sector boundaries for the app.

Inputs (argv, not committed):
  1. Client-supplied postcode DISTRICT boundaries (FileGDB, layer
     'PostcodeDistricts', field 'District', EPSG:29902) — real supplied
     boundaries, used as-is (reprojected + lightly simplified).
  2. Client-supplied, licence-cleared NSPL (Nov 2020) BT unit-postcode points
     (shapefile, field 'USER_pcd', EPSG:29902) — used only to DERIVE sector
     boundaries: a Voronoi tessellation of each district's precise unit-postcode
     locations, clipped to that district's REAL boundary and dissolved by
     sector. Sectors therefore nest exactly inside the supplied districts and
     remain indicative; districts are as supplied.

Outputs (app/public/data/):
  pc_districts_joined.geojson / pc_sectors_joined.geojson — published POMNI
  results joined where they exist (pub=1); EVERY feature carries every value
  field (null when unpublished) because GeoJSONLayer infers its schema from
  leading features. Published coverage 48/48 + 23/23 is asserted.
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
from shapely.geometry import MultiPolygon, Polygon
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parent.parent
UNIT_RE = re.compile(r"^(BT\d+) (\d)[A-Z]{2}$")
SIMPLIFY_M = 20

tr_out = Transformer.from_crs(29902, 4326, always_xy=True)


def to_wgs(geom):
    return shapely.transform(geom, lambda a: np.column_stack(tr_out.transform(a[:, 0], a[:, 1])))


def finite_voronoi_cells(vor: Voronoi) -> list[Polygon | None]:
    """Finite polygon per input point (standard unbounded-cell closure)."""
    center = vor.points.mean(axis=0)
    radius = 1e6
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
            new_region = [v for v in vertices if v >= 0]
            pts = [vor.vertices[v] for v in new_region]
            for p2, v1, v2 in all_ridges.get(p1, []):
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


NULL_PROPS = {
    "name": None, "n": None, "total_pct": None, "total_index": None,
    "idx_at": None, "idx_aw": None, "idx_q": None, "idx_b": None,
}


def feature(code: str, geom, row: dict | None) -> dict:
    props = {"code": code, "pub": 1 if row else 0, **NULL_PROPS}
    if row:
        t = row["themes_index"]
        props.update(
            name=row["place"], n=row["sample_n"],
            total_pct=row["total_pct"], total_index=row["total_index"],
            idx_at=t["access_to"], idx_aw=t["access_within"],
            idx_q=t["quality"], idx_b=t["benefits"],
        )
    gj = json.loads(json.dumps(to_wgs(geom).__geo_interface__), parse_float=lambda v: round(float(v), 5))
    return {"type": "Feature", "properties": props, "geometry": gj}


def main() -> None:
    gdb, shp = Path(sys.argv[1]), Path(sys.argv[2])

    # ——— real district boundaries ———
    meta, _, geoms, fields = pyogrio.raw.read(gdb, columns=["District"], force_2d=True)
    district_geom: dict[str, MultiPolygon] = {}
    for wkb, code in zip(geoms, fields[0]):
        g = shapely.from_wkb(wkb).buffer(0)
        district_geom[str(code).strip()] = g

    # ——— unit points, grouped by district/sector ———
    m2, _, pgeoms, pfields = pyogrio.raw.read(shp, columns=["USER_pcd", "Status", "ShortLabel"], force_2d=True)
    pidx = {n: i for i, n in enumerate(m2["fields"])}
    pts_by_district: dict[str, list] = {}
    for wkb, pcd, status, short in zip(
        pgeoms, pfields[pidx["USER_pcd"]], pfields[pidx["Status"]], pfields[pidx["ShortLabel"]]
    ):
        if status != "M":
            continue
        raw = str(pcd or "").strip()
        if len(raw) < 5:
            continue
        inward, outward = raw[-3:], raw[:-3].strip()
        if not re.match(r"^BT\d+$", outward) or not re.match(r"^\d[A-Z]{2}$", inward):
            continue
        if not UNIT_RE.match(str(short or "").strip()):
            continue  # precise unit-level geocodes only
        g = shapely.from_wkb(wkb)
        pts_by_district.setdefault(outward, []).append((g.x, g.y, f"{outward} {inward[0]}"))

    districts_pub = {r["postcode_area"]: r for r in json.loads((ROOT / "data/postcode_area_results.json").read_text())}
    sectors_pub = {r["postcode_sector"]: r for r in json.loads((ROOT / "data/postcode_sector_results.json").read_text())}

    d_feats, s_feats = [], []
    d_cov, s_cov = set(), set()
    for code in sorted(district_geom):
        dgeom = district_geom[code].simplify(SIMPLIFY_M, preserve_topology=True).buffer(0)
        row = districts_pub.get(code)
        if row:
            d_cov.add(code)
        d_feats.append(feature(code, dgeom, row))

        # sectors: Voronoi of this district's unit points, clipped to the REAL
        # district boundary, dissolved by sector
        pts = pts_by_district.get(code, [])
        seen: dict[tuple, str] = {}
        for x, y, sector in pts:
            seen.setdefault((round(x, 1), round(y, 1)), sector)
        coords = np.array(list(seen.keys()))
        sectors_here = sorted({s for s in seen.values()})
        by_sector: dict[str, list] = {}
        if len(coords) >= 4 and len(sectors_here) > 1:
            vor = Voronoi(coords)
            cells = finite_voronoi_cells(vor)
            for cell, sector in zip(cells, seen.values()):
                if cell is not None:
                    by_sector.setdefault(sector, []).append(cell)
        elif sectors_here:
            # a district with a single sector (or too few points): the sector
            # IS the district
            by_sector[sectors_here[0]] = [district_geom[code]]
        for sector, cell_list in sorted(by_sector.items()):
            sgeom = unary_union(cell_list).intersection(district_geom[code])
            sgeom = sgeom.simplify(SIMPLIFY_M, preserve_topology=True).buffer(0)
            if sgeom.is_empty:
                continue
            srow = sectors_pub.get(sector)
            if srow:
                s_cov.add(sector)
            s_feats.append(feature(sector, sgeom, srow))

    d_missing = set(districts_pub) - d_cov
    s_missing = set(sectors_pub) - s_cov
    if d_missing or s_missing:
        sys.exit(f"FATAL: published units without boundaries: {sorted(d_missing | s_missing)}")

    dd = ROOT / "app/public/data/pc_districts_joined.geojson"
    sd = ROOT / "app/public/data/pc_sectors_joined.geojson"
    dd.write_text(json.dumps({"type": "FeatureCollection", "features": d_feats}, separators=(",", ":")))
    sd.write_text(json.dumps({"type": "FeatureCollection", "features": s_feats}, separators=(",", ":")))
    print(
        f"OK: {len(d_feats)} districts ({dd.stat().st_size//1024} KiB, real boundaries), "
        f"{len(s_feats)} sectors ({sd.stat().st_size//1024} KiB, derived within districts); "
        f"published joins {len(d_cov)}/48 districts, {len(s_cov)}/23 sectors"
    )


if __name__ == "__main__":
    main()
