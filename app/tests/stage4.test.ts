import { describe, expect, it } from "vitest";
import { screenCouncils } from "../src/features/insights/OpportunityExplorer";
import { initialState, reducer } from "../src/state/AppState";
import type { ProvisionRecord } from "../src/features/pvp/provision";

const mkProvision = (values: Record<string, number>): Record<string, ProvisionRecord> =>
  Object.fromEntries(
    Object.entries(values).map(([code, pct400]) => [
      code,
      { lgdName: code, year: 2026, pct400, pct1km: null, pct2km: null },
    ]),
  );

// Published 2026 council Percent400 values (live-verified 2026-11-04)
const live2026: Record<string, number> = {
  N09000001: 52.53, N09000002: 37.18, N09000003: 72.73, N09000004: 45.52,
  N09000005: 56.64, N09000006: 22.89, N09000007: 39.92, N09000008: 43.76,
  N09000009: 26.63, N09000010: 39.79, N09000011: 51.49,
};
const NI_REF = 47.75;

describe("opportunity screening (transparent indicators, no invented scores)", () => {
  it("flags the three lowest Access To councils on the perception indicator", () => {
    const rows = screenCouncils(mkProvision(live2026), NI_REF);
    const codes = rows.map((r) => r.code);
    // F&O (84), Mid Ulster (88), ACB&C (91) are the published <96 councils
    for (const c of ["N09000006", "N09000009", "N09000002"]) {
      expect(codes).toContain(c);
      expect(
        rows.find((r) => r.code === c)!.flags.some((f) => f.includes("Perceived access")),
      ).toBe(true);
    }
  });

  it("never flags a council whose indicators are all at/above the references", () => {
    const rows = screenCouncils(mkProvision(live2026), NI_REF);
    // Belfast: access_to 109, 72.7% vs 47.75% — nothing to flag
    expect(rows.map((r) => r.code)).not.toContain("N09000003");
  });

  it("flags perception-lags-provision divergence (Derry & Strabane)", () => {
    const rows = screenCouncils(mkProvision(live2026), NI_REF);
    const derry = rows.find((r) => r.code === "N09000005");
    expect(derry).toBeDefined();
    expect(derry!.flags.some((f) => f.includes("Perception lags"))).toBe(true);
  });

  it("degrades to perception-only screening when provision is unavailable", () => {
    const rows = screenCouncils(null, null);
    expect(rows.length).toBeGreaterThanOrEqual(3);
    for (const r of rows) {
      expect(r.pct400).toBeNull();
      expect(r.flags.every((f) => !f.includes("provision below"))).toBe(true);
    }
  });

  it("shows indicator values rather than a composite score", () => {
    const rows = screenCouncils(mkProvision(live2026), NI_REF);
    for (const r of rows) {
      expect(typeof r.accessToIdx).toBe("number");
      expect(Array.isArray(r.flags)).toBe(true);
      expect((r as unknown as Record<string, unknown>).score).toBeUndefined();
    }
  });
});

describe("stage 4 state", () => {
  it("lands on the overview", () => {
    expect(initialState.mode).toBe("overview");
  });
  it("entering the accessibility explorer turns the surface on", () => {
    const s = reducer({ ...initialState, sdzOn: false }, { type: "mode", mode: "access" });
    expect(s.mode).toBe("access");
    expect(s.sdzOn).toBe(true);
  });
  it("insights tabs and report/tour/zoom actions round-trip", () => {
    let s = reducer(initialState, { type: "insightsTab", tab: "opportunities" });
    expect(s.insightsTab).toBe("opportunities");
    s = reducer(s, { type: "report", open: true });
    expect(s.reportOpen).toBe(true);
    s = reducer(s, { type: "tour", step: 2 });
    expect(s.tourStep).toBe(2);
    s = reducer(s, { type: "zoomSdz", code: "SDZ123" });
    expect(s.pendingSdzZoom).toBe("SDZ123");
    s = reducer(s, { type: "zoomSdz", code: null });
    expect(s.pendingSdzZoom).toBeNull();
  });
});
