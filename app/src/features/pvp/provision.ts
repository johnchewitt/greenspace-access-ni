import { LGD_DISPLAY } from "../../data";

export interface ProvisionRecord {
  lgdName: string;
  year: number | null;
  pct400: number | null;
  pct1km: number | null;
  pct2km: number | null;
}

export interface ProvisionAttrs {
  LGDName?: string;
  LGDCode?: string;
  Year_?: string | number;
  Percent400?: number;
  Percent1km?: number;
  Percent2km?: number;
}

const norm = (s: string) =>
  s.toLowerCase().replace(/city|and|&|borough|council|district|,|\s+/g, "");

const NAME_TO_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(LGD_DISPLAY).map(([code, name]) => [norm(name), code]),
);

/**
 * The GreenspaceNI_Council_Analysis2025 service holds one row per council per
 * analysis year (2023–2026 observed on 2026-11-04). Pick each council's most
 * recent vintage and carry the year so the UI can label it. Values are already
 * percentages (verified against the live service). Codes are N09…; normalised
 * name matching is kept as a fallback only.
 */
export function pickLatestProvision(
  features: { attributes: ProvisionAttrs }[],
): { byCode: Record<string, ProvisionRecord>; year: number | null } {
  const byCode: Record<string, ProvisionRecord> = {};
  for (const f of features) {
    const a = f.attributes;
    const code =
      a.LGDCode && a.LGDCode.startsWith("N09")
        ? a.LGDCode
        : NAME_TO_CODE[norm(a.LGDName ?? "")];
    if (!code) continue;
    const year = a.Year_ != null ? Number(a.Year_) : null;
    const existing = byCode[code];
    if (!existing || (year ?? -1) > (existing.year ?? -1)) {
      byCode[code] = {
        lgdName: a.LGDName ?? "",
        year: Number.isFinite(year) ? year : null,
        pct400: a.Percent400 ?? null,
        pct1km: a.Percent1km ?? null,
        pct2km: a.Percent2km ?? null,
      };
    }
  }
  const years = Object.values(byCode)
    .map((r) => r.year)
    .filter((y): y is number => y != null);
  const year = years.length ? Math.max(...years) : null;
  return { byCode, year };
}

export interface NIProvision {
  year: number | null;
  pct400: number | null;
  pct1km: number | null;
  pct2km: number | null;
}

/** Pick the latest NI-wide row (service holds one row per analysis year). */
export function pickLatestNI(
  features: { attributes: { Year_?: string | number; Percent400?: number; Percent1km?: number; Percent2km?: number } }[],
): NIProvision | null {
  let best: NIProvision | null = null;
  for (const f of features) {
    const a = f.attributes;
    const year = a.Year_ != null ? Number(a.Year_) : null;
    if (!best || (year ?? -1) > (best.year ?? -1)) {
      best = {
        year: Number.isFinite(year) ? year : null,
        pct400: a.Percent400 ?? null,
        pct1km: a.Percent1km ?? null,
        pct2km: a.Percent2km ?? null,
      };
    }
  }
  return best;
}

/** Display formatter: service values are percentages already. */
export const fmtProvision = (v: number | null) => (v == null ? "—" : `${v.toFixed(1)}%`);
