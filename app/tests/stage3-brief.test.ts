import { describe, expect, it } from "vitest";
import { classifyQuadrants, interpretQuadrants, QUADRANT_META } from "../src/features/pvp/quadrant";
import { pickLatestNI } from "../src/features/pvp/provision";
import { initialState, reducer } from "../src/state/AppState";
import { lgd } from "../src/data";
import type { ProvisionRecord } from "../src/features/pvp/provision";

const mkProvision = (values: Record<string, number>): Record<string, ProvisionRecord> =>
  Object.fromEntries(
    Object.entries(values).map(([code, pct400]) => [
      code,
      { lgdName: code, year: 2026, pct400, pct1km: null, pct2km: null },
    ]),
  );

describe("perception/provision quadrant classification", () => {
  // Published 2026 council Percent400 values (live-verified 2026-11-04)
  const live2026: Record<string, number> = {
    N09000001: 52.53, N09000002: 37.18, N09000003: 72.73, N09000004: 45.52,
    N09000005: 56.64, N09000006: 22.89, N09000007: 39.92, N09000008: 43.76,
    N09000009: 26.63, N09000010: 39.79, N09000011: 51.49,
  };

  it("classifies all 11 councils against NI refs with no leftovers", () => {
    const q = classifyQuadrants(mkProvision(live2026), 47.75);
    expect(q).not.toBeNull();
    expect(q!.points).toHaveLength(11);
    const total = Object.values(q!.byQuadrant).reduce((a, l) => a + l.length, 0);
    expect(total).toBe(11);
    expect(q!.provisionRefSource).toBe("ni_published");
  });

  it("places known cases correctly (Belfast H/H; Fermanagh & Omagh L/L; Ards & North Down H/H)", () => {
    const q = classifyQuadrants(mkProvision(live2026), 47.75)!;
    const find = (code: string) => q.points.find((p) => p.code === code)!.quadrant;
    expect(find("N09000003")).toBe("hp_hp"); // index 103.4, 72.73%
    expect(find("N09000006")).toBe("lp_lp"); // index 94.2, 22.89%
    expect(find("N09000011")).toBe("hp_hp"); // index 101.9, 51.49%
    expect(find("N09000010")).toBe("lp_lp"); // index 99.7, 39.79%
  });

  it("falls back to the council median when no NI reference is available", () => {
    const q = classifyQuadrants(mkProvision(live2026), null)!;
    expect(q.provisionRefSource).toBe("council_median");
    expect(q.provisionRef).toBeGreaterThan(20);
    expect(q.provisionRef).toBeLessThan(60);
  });

  it("returns null (study-wide only) when comparable data is too sparse", () => {
    expect(classifyQuadrants(mkProvision({ N09000003: 72.7 }), 48)).toBeNull();
  });

  it("interpretation names divergent councils and always carries the caveat", () => {
    const q = classifyQuadrants(mkProvision(live2026), 47.75)!;
    const text = interpretQuadrants(q);
    expect(text).toContain("prompt for further investigation");
    expect(text).not.toContain("gap is proven");
  });

  it("quadrant metadata covers all four quadrants with distinct colours", () => {
    const colors = Object.values(QUADRANT_META).map((m) => m.color);
    expect(new Set(colors).size).toBe(4);
  });
});

describe("NI-wide provision picker", () => {
  it("selects the latest vintage", () => {
    const ni = pickLatestNI([
      { attributes: { Year_: "2023", Percent400: 48.18 } },
      { attributes: { Year_: "2026", Percent400: 48.0, Percent1km: 75.22, Percent2km: 84.8 } },
      { attributes: { Year_: "2025", Percent400: 48.02 } },
    ]);
    expect(ni?.year).toBe(2026);
    expect(ni?.pct400).toBe(48.0);
  });
});

describe("stage 3 state additions", () => {
  it("supports insights and story modes", () => {
    expect(reducer(initialState, { type: "mode", mode: "insights" }).mode).toBe("insights");
    expect(reducer(initialState, { type: "mode", mode: "story" }).mode).toBe("story");
  });

  it("sdz threshold field switches", () => {
    const s = reducer(initialState, { type: "sdzField", field: "Percent2km" });
    expect(s.sdzField).toBe("Percent2km");
  });

  it("selection clears quadrant emphasis; leaving pvp clears it too", () => {
    const withEmph = reducer(initialState, { type: "emphasize", codes: ["N09000003"] });
    expect(withEmph.emphasizedCodes).toEqual(["N09000003"]);
    expect(reducer(withEmph, { type: "select", code: "N09000006" }).emphasizedCodes).toBeNull();
    expect(reducer(withEmph, { type: "mode", mode: "explore" }).emphasizedCodes).toBeNull();
  });
});

describe("data sanity for story claims", () => {
  it("the three lowest Access To councils named in the story are correct", () => {
    const sorted = [...lgd].sort((a, b) => a.themes_index.access_to - b.themes_index.access_to);
    expect(sorted.slice(0, 3).map((r) => r.lad_code).sort()).toEqual(
      ["N09000002", "N09000006", "N09000009"].sort(),
    );
    expect(sorted[0].themes_index.access_to).toBe(84);
  });
});
