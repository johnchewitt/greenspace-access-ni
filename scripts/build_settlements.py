#!/usr/bin/env python3
"""Prepare the OSNI 50k settlement polygons for bundling as a context layer.

Input: client-supplied OSNI_Settlements_50k.geojson (argv[1]; not committed).
The source has no name attribute — only a settlement class (TEMA) — so this
layer is footprint context only; no labels can honestly be derived from it.

Output: app/public/data/osni_settlements.json — Z values stripped, coordinates
rounded to 5 dp, properties reduced to the class code.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
KEEP_CLASSES = {"LRG_TOWN", "TOWN", "VILLAGE", "SMALL_VILL"}


def strip(coords):
    if isinstance(coords[0], (int, float)):
        return [round(coords[0], 5), round(coords[1], 5)]
    return [strip(c) for c in coords]


def main() -> None:
    src = json.loads(Path(sys.argv[1]).read_text())
    feats = []
    for f in src["features"]:
        cls = f["properties"].get("TEMA")
        if cls not in KEEP_CLASSES:
            continue
        feats.append(
            {
                "type": "Feature",
                "properties": {"cls": cls},
                "geometry": {
                    "type": f["geometry"]["type"],
                    "coordinates": strip(f["geometry"]["coordinates"]),
                },
            }
        )
    out = {"type": "FeatureCollection", "features": feats}
    dest = ROOT / "app/public/data/osni_settlements.json"
    dest.write_text(json.dumps(out, separators=(",", ":")))
    print(f"OK: {len(feats)} settlement polygons -> {dest} ({dest.stat().st_size // 1024} KiB)")


if __name__ == "__main__":
    main()
