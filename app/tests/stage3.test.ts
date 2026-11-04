import { describe, expect, it } from "vitest";
import { computeScores, Q14_STATEMENTS, THEME_MAX } from "../src/features/understand/scoring";
import { buildSdzRenderer, sdzRamp } from "../src/map/renderers";
import { postcodeRows } from "../src/charts/postcode";
import { rankings, postcodeAreas } from "../src/data";

describe("interactive scoring explainer (published method)", () => {
  it("statement-to-theme assignment matches the methodology (1/2/4/2 + Q15)", () => {
    const byTheme = Q14_STATEMENTS.reduce<Record<string, number>>((acc, s) => {
      acc[s.theme] = (acc[s.theme] ?? 0) + 1;
      return acc;
    }, {});
    expect(byTheme).toEqual({ access_to: 1, access_within: 2, quality: 4, benefits: 2 });
    expect(THEME_MAX).toEqual({ access_to: 10, access_within: 10, quality: 20, benefits: 10 });
  });

  it("computes theme percentages and the overall average per the published formulas", () => {
    // Q14 order in the explainer: car-free, safe, inclusive, navigate, amenities,
    // cared-for, nature, mental-health, community; Q15 = 5.
    // (The report's slide-6 example row is internally inconsistent — its printed
    // Quality cells sum to 16/20 but its printed total reads 11/20 — so the
    // method is asserted against the published formulas, not that row.)
    const r = computeScores([5, 5, 3, 5, 2, 4, 5, 4, 4], 5);
    expect(r.points).toEqual({ access_to: 10, access_within: 8, quality: 16, benefits: 8 });
    expect(r.themes).toEqual({ access_to: 100, access_within: 80, quality: 80, benefits: 80 });
    expect(r.overall).toBe(85);
  });

  it("all-maximum answers give 100% everywhere; all-minimum give 20%", () => {
    const top = computeScores([5, 5, 5, 5, 5, 5, 5, 5, 5], 5);
    expect(top.overall).toBe(100);
    const bottom = computeScores([1, 1, 1, 1, 1, 1, 1, 1, 1], 1);
    expect(bottom.overall).toBe(20);
  });
});

describe("SDZ provision renderer", () => {
  it("has 5 classes on Percent400 covering 0–100 without gaps", () => {
    const r = buildSdzRenderer();
    expect(r.field).toBe("Percent400");
    expect(r.classBreakInfos).toHaveLength(sdzRamp.length);
    for (const v of [0, 19.99, 20, 45.8, 72.9, 80, 100]) {
      const matches = r.classBreakInfos.filter(
        (c) => v >= (c.minValue ?? -Infinity) && v <= (c.maxValue ?? Infinity),
      );
      expect(matches).toHaveLength(1);
    }
  });
});

describe("postcode compare data", () => {
  it("exposes all published rows with sample sizes", () => {
    expect(postcodeRows("areas")).toHaveLength(48);
    expect(postcodeRows("sectors")).toHaveLength(23);
    postcodeRows("areas").forEach((r) => expect(r.n).toBeGreaterThanOrEqual(30));
  });

  it("published theme top-tens are complete and reference published areas", () => {
    const codes = new Set(postcodeAreas.map((r) => r.postcode_area));
    const data = rankings as Record<string, { rank: number; code: string }[]>;
    for (const theme of ["access_to", "access_within", "quality", "benefits"]) {
      expect(data[theme]).toHaveLength(10);
      data[theme].forEach((row, i) => {
        expect(row.rank).toBe(i + 1);
        expect(codes.has(row.code)).toBe(true);
      });
    }
  });
});
