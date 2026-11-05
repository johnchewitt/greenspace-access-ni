import { LGD_DISPLAY, lgd } from "../../data";
import type { ProvisionRecord } from "./provision";

export type QuadrantId = "hp_hp" | "hp_lp" | "lp_hp" | "lp_lp";

export interface QuadrantPoint {
  code: string;
  name: string;
  index: number; // perception: overall index, NI = 100
  pct400: number; // provision: % households within 400 m
  quadrant: QuadrantId;
}

export interface QuadrantResult {
  points: QuadrantPoint[];
  provisionRef: number;
  perceptionRef: number;
  provisionRefSource: "ni_published" | "council_median";
  byQuadrant: Record<QuadrantId, QuadrantPoint[]>;
}

export const QUADRANT_META: Record<
  QuadrantId,
  { label: string; short: string; color: string }
> = {
  hp_hp: { label: "Higher perception · higher provision", short: "High / High", color: "#43DCC1" },
  hp_lp: { label: "Higher perception · lower provision", short: "High / Low", color: "#B8E883" },
  lp_hp: { label: "Lower perception · higher provision", short: "Low / High", color: "#7FAEF5" },
  lp_lp: { label: "Lower perception · lower provision", short: "Low / Low", color: "#E2A95B" },
};

/**
 * Classify the 11 councils by perception (overall index vs the NI average of
 * 100) and provision (% households within 400 m vs the published NI-wide
 * figure; council median as fallback when the NI figure is unavailable).
 * Thresholds are stated in the UI. Published values only; "higher/lower" are
 * relative positions, not judgements of adequacy, and margins of error mean
 * councils near a line should be read loosely.
 */
export function classifyQuadrants(
  provisionByCode: Record<string, ProvisionRecord>,
  niProvisionRef: number | null,
): QuadrantResult | null {
  const rows = lgd
    .map((r) => ({
      code: r.lad_code,
      name: LGD_DISPLAY[r.lad_code],
      index: r.total_index,
      pct400: provisionByCode[r.lad_code]?.pct400 ?? null,
    }))
    .filter((r): r is { code: string; name: string; index: number; pct400: number } =>
      r.pct400 != null,
    );
  if (rows.length < 6) return null; // not enough comparable data — show study-wide only

  let provisionRef = niProvisionRef;
  let provisionRefSource: QuadrantResult["provisionRefSource"] = "ni_published";
  if (provisionRef == null) {
    const sorted = [...rows].sort((a, b) => a.pct400 - b.pct400);
    const mid = Math.floor(sorted.length / 2);
    provisionRef =
      sorted.length % 2 ? sorted[mid].pct400 : (sorted[mid - 1].pct400 + sorted[mid].pct400) / 2;
    provisionRefSource = "council_median";
  }

  const points: QuadrantPoint[] = rows.map((r) => {
    const hp = r.index >= 100;
    const hProv = r.pct400 >= provisionRef!;
    const quadrant: QuadrantId = hp
      ? hProv
        ? "hp_hp"
        : "hp_lp"
      : hProv
        ? "lp_hp"
        : "lp_lp";
    return { ...r, quadrant };
  });

  const byQuadrant: Record<QuadrantId, QuadrantPoint[]> = {
    hp_hp: [],
    hp_lp: [],
    lp_hp: [],
    lp_lp: [],
  };
  points.forEach((p) => byQuadrant[p.quadrant].push(p));

  return { points, provisionRef, perceptionRef: 100, provisionRefSource, byQuadrant };
}

/** One-paragraph interpretation drawn only from the classification itself. */
export function interpretQuadrants(q: QuadrantResult): string {
  const name = (list: QuadrantPoint[]) => list.map((p) => p.name).join(", ");
  const parts: string[] = [];
  if (q.byQuadrant.hp_lp.length) {
    parts.push(
      `${name(q.byQuadrant.hp_lp)} report above-average perceptions despite below-reference mapped provision — perceptions can draw on qualities the provision measure doesn't capture.`,
    );
  }
  if (q.byQuadrant.lp_hp.length) {
    parts.push(
      `${name(q.byQuadrant.lp_hp)} show the reverse — mapped provision at or above the reference but below-average perceptions.`,
    );
  }
  if (parts.length === 0) {
    parts.push(
      "Perception and mapped provision point the same way for every council — agreement, not a divergence to investigate.",
    );
  }
  parts.push(
    "Divergence is a prompt for further investigation, not a proven gap or a causal claim.",
  );
  return parts.join(" ");
}
