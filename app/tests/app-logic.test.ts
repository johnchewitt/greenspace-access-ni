import { describe, expect, it } from "vitest";
import { initialState, reducer } from "../src/state/AppState";
import { buildRenderer, legendEntries, metricField } from "../src/map/renderers";
import { pickLatestProvision, fmtProvision } from "../src/features/pvp/provision";
import { divRamp, indexBreaks, pctBreaks, seqRamp } from "../src/config/branding";

describe("app state reducer", () => {
  it("selecting a theme while in % view moves to index (themes publish indices only)", () => {
    const s = reducer({ ...initialState, format: "pct" }, { type: "metric", metric: "quality" });
    expect(s.metric).toBe("quality");
    expect(s.format).toBe("index");
  });

  it("overall metric keeps the chosen format", () => {
    const s = reducer({ ...initialState, format: "pct" }, { type: "metric", metric: "total" });
    expect(s.format).toBe("pct");
  });

  it("entering PvP turns on the provision evidence and remembers the split opened", () => {
    const s = reducer(initialState, { type: "mode", mode: "pvp" });
    expect(s.pvpOpened).toBe(true);
    expect(s.layers.greenspace).toBe(true);
    expect(s.layers.trails).toBe(true);
    expect(s.layers.accessPoints).toBe(true);
    expect(s.basemapOn).toBe(true);
    const back = reducer(s, { type: "mode", mode: "explore" });
    expect(back.pvpOpened).toBe(true); // second map stays mounted
  });

  it("selecting an area opens the right panel", () => {
    const s = reducer({ ...initialState, rightOpen: false }, { type: "select", code: "N09000003" });
    expect(s.rightOpen).toBe(true);
    expect(s.selectedCode).toBe("N09000003");
  });
});

describe("choropleth renderers (defined class breaks)", () => {
  it("maps metric/format to the published fields", () => {
    expect(metricField("total", "pct")).toBe("total_pct");
    expect(metricField("total", "index")).toBe("total_index");
    expect(metricField("access_to", "index")).toBe("idx_at");
    expect(metricField("benefits", "index")).toBe("idx_b");
  });

  it("builds 5 classes with the diverging ramp for index views", () => {
    const r = buildRenderer("total", "index");
    expect(r.classBreakInfos).toHaveLength(divRamp.length);
    expect(r.field).toBe("total_index");
    // class edges follow the defined breaks
    expect(r.classBreakInfos[1].minValue).toBe(indexBreaks[0]);
    expect(r.classBreakInfos[4].minValue).toBe(indexBreaks[3]);
  });

  it("builds 5 sequential classes for the % view with stated labels", () => {
    const r = buildRenderer("total", "pct");
    expect(r.classBreakInfos).toHaveLength(seqRamp.length);
    expect(r.classBreakInfos[1].minValue).toBe(pctBreaks[0]);
    const legend = legendEntries("total", "pct");
    expect(legend).toHaveLength(5);
    legend.forEach((e) => expect(e.label.length).toBeGreaterThan(3));
  });

  it("every published value lands in exactly one class (no gaps/overlaps)", () => {
    const r = buildRenderer("total", "index");
    const sample = [84, 95.99, 96, 97.9, 98, 101.99, 102, 103.9, 104, 112.5];
    for (const v of sample) {
      const matches = r.classBreakInfos.filter(
        (c) => v >= (c.minValue ?? -Infinity) && v <= (c.maxValue ?? Infinity),
      );
      expect(matches).toHaveLength(1);
    }
  });
});

describe("provision vintage selection", () => {
  const row = (code: string, year: number, p400: number) => ({
    attributes: {
      LGDCode: code,
      LGDName: "Belfast",
      Year_: String(year),
      Percent400: p400,
      Percent1km: 99.83,
      Percent2km: 100,
    },
  });

  it("picks the latest analysis year per council (service holds 2023–2026 rows)", () => {
    const { byCode, year } = pickLatestProvision([
      row("N09000003", 2023, 72.9),
      row("N09000003", 2026, 72.73),
      row("N09000003", 2024, 72.84),
      row("N09000003", 2025, 72.81),
    ]);
    expect(year).toBe(2026);
    expect(byCode.N09000003.pct400).toBe(72.73);
  });

  it("falls back to normalised name matching when the code is not N09…", () => {
    const { byCode } = pickLatestProvision([
      {
        attributes: {
          LGDCode: "LGD2014_11",
          LGDName: "Ards and North Down",
          Year_: "2025",
          Percent400: 51.57,
        },
      },
    ]);
    expect(byCode.N09000011?.pct400).toBe(51.57);
  });

  it("formats service values as plain percentages (already-percent units verified live)", () => {
    expect(fmtProvision(72.73)).toBe("72.7%");
    expect(fmtProvision(null)).toBe("—");
  });
});
