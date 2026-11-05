import { useEffect, useState } from "react";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import { outscapeLayers } from "../../config/services";

export interface InsightStats {
  greenspaceHa: number | null;
  greenspaceCount: number | null;
  trailCount: number | null;
  accessPointCount: number | null;
  failed: boolean;
}

/**
 * Live headline statistics from the Greenspace NI Map services — the same
 * sum/count statistics Outscape's own public dashboard computes on these
 * layers. Nothing is hard-coded: values reflect the services at view time,
 * and every figure degrades to "—" with an offline note if a query fails.
 */
export function useInsightStats(active: boolean): InsightStats | null {
  const [stats, setStats] = useState<InsightStats | null>(null);
  useEffect(() => {
    if (!active || stats) return;
    let cancelled = false;
    const gs = new FeatureLayer({ url: outscapeLayers.greenspace.url });
    const trails = new FeatureLayer({ url: outscapeLayers.trails.url });
    const points = new FeatureLayer({ url: outscapeLayers.accessPoints.url });

    const areaQuery = {
      where: outscapeLayers.greenspace.definitionExpression ?? "1=1",
      outStatistics: [
        { statisticType: "sum", onStatisticField: "Area_Ha", outStatisticFieldName: "total_ha" },
        { statisticType: "count", onStatisticField: "OBJECTID", outStatisticFieldName: "n_sites" },
      ],
      returnGeometry: false,
    };
    const areaAndCount = gs
      .queryFeatures(areaQuery as unknown as Parameters<typeof gs.queryFeatures>[0])
      .then((fs) => {
        const a = fs.features[0]?.attributes as { total_ha?: number; n_sites?: number };
        return { ha: a?.total_ha ?? null, n: a?.n_sites ?? null };
      })
      .catch(() => ({ ha: null, n: null }));

    const trailCount = trails
      .queryFeatureCount({
        where: outscapeLayers.trails.definitionExpression ?? "1=1",
      } as unknown as Parameters<typeof trails.queryFeatureCount>[0])
      .catch(() => null);
    const pointCount = points
      .queryFeatureCount({
        where: outscapeLayers.accessPoints.definitionExpression ?? "1=1",
      } as unknown as Parameters<typeof points.queryFeatureCount>[0])
      .catch(() => null);

    Promise.all([areaAndCount, trailCount, pointCount]).then(([gsr, tc, pc]) => {
      if (cancelled) return;
      setStats({
        greenspaceHa: gsr.ha,
        greenspaceCount: gsr.n,
        trailCount: tc,
        accessPointCount: pc,
        failed: gsr.ha == null && gsr.n == null && tc == null && pc == null,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [active, stats]);
  return stats;
}

export const fmtInt = (v: number | null) =>
  v == null ? "—" : Math.round(v).toLocaleString("en-GB");
export const fmtHa = (v: number | null) =>
  v == null ? "—" : `${Math.round(v).toLocaleString("en-GB")} ha`;
