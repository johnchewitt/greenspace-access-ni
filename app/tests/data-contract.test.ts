import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  LGD_DISPLAY,
  THEME_ORDER,
  lgd,
  lgdByCode,
  ni,
  postcodeAreas,
  postcodeSectors,
} from "../src/data";

describe("national results (report slide 7)", () => {
  it("matches the five published national scores exactly", () => {
    expect(ni.totalPct).toBe(77);
    expect(ni.themesPct.access_to).toBe(65);
    expect(ni.themesPct.access_within).toBe(81);
    expect(ni.themesPct.quality).toBe(80);
    expect(ni.themesPct.benefits).toBe(83);
  });
});

describe("council results (report slides 8–9)", () => {
  it("has exactly 11 councils with N09 codes", () => {
    expect(lgd).toHaveLength(11);
    const codes = lgd.map((r) => r.lad_code).sort();
    expect(codes).toEqual(
      Array.from({ length: 11 }, (_, i) => `N090000${String(i + 1).padStart(2, "0")}`),
    );
  });

  it("every council has a display name and all four theme indices", () => {
    for (const r of lgd) {
      expect(LGD_DISPLAY[r.lad_code]).toBeTruthy();
      for (const t of THEME_ORDER) expect(r.themes_index[t]).toBeGreaterThan(0);
    }
  });

  it("spot-checks published values (Belfast, Fermanagh & Omagh)", () => {
    const belfast = lgdByCode.N09000003;
    expect(belfast.total_pct).toBeCloseTo(79.65, 2);
    expect(belfast.total_index).toBeCloseTo(103.374, 3);
    expect(belfast.themes_index.access_to).toBe(109);
    const fo = lgdByCode.N09000006;
    expect(fo.total_pct).toBeCloseTo(73.23, 2);
    expect(fo.themes_index.access_to).toBe(84);
  });

  it("theme indices reconcile with published totals (±0.6pp, integer-rounded indices)", () => {
    const NI_T = { access_to: 65, access_within: 81, quality: 80, benefits: 83 };
    for (const r of lgd) {
      const implied =
        (NI_T.access_to * r.themes_index.access_to +
          NI_T.access_within * r.themes_index.access_within +
          NI_T.quality * r.themes_index.quality +
          NI_T.benefits * r.themes_index.benefits) /
        400;
      expect(Math.abs(implied - r.total_pct)).toBeLessThan(0.6);
    }
  });
});

describe("postcode geographies honour the reporting threshold", () => {
  it("every published postcode row has n ≥ 30", () => {
    for (const r of [...postcodeAreas, ...postcodeSectors]) {
      expect(r.sample_n).toBeGreaterThanOrEqual(30);
    }
    expect(postcodeAreas).toHaveLength(48);
    expect(postcodeSectors).toHaveLength(23);
  });
});

describe("boundary join asset", () => {
  it("joined GeoJSON carries the same values as the data facade", () => {
    const path = fileURLToPath(new URL("../public/data/ni_lgd_joined.geojson", import.meta.url));
    const gj = JSON.parse(readFileSync(path, "utf-8")) as {
      features: { properties: Record<string, number | string> }[];
    };
    expect(gj.features).toHaveLength(11);
    for (const f of gj.features) {
      const r = lgdByCode[f.properties.code as string];
      expect(r).toBeTruthy();
      expect(f.properties.total_pct).toBeCloseTo(r.total_pct, 2);
      expect(f.properties.total_index).toBeCloseTo(r.total_index, 3);
      expect(f.properties.idx_at).toBe(r.themes_index.access_to);
      expect(f.properties.idx_aw).toBe(r.themes_index.access_within);
      expect(f.properties.idx_q).toBe(r.themes_index.quality);
      expect(f.properties.idx_b).toBe(r.themes_index.benefits);
    }
  });
});
