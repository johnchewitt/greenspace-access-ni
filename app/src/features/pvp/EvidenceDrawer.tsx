import { useMemo, useState } from "react";
import type { EChartsCoreOption } from "echarts/core";
import { Chart } from "../../charts/Chart";
import { ink } from "../../config/branding";
import { useAppDispatch, useAppState } from "../../state/AppState";
import {
  QUADRANT_META,
  classifyQuadrants,
  interpretQuadrants,
  type QuadrantId,
  type QuadrantResult,
} from "./quadrant";
import type { ProvisionRecord } from "./provision";

const font = "Manrope, sans-serif";

function scatterOption(q: QuadrantResult): EChartsCoreOption {
  return {
    textStyle: { fontFamily: font, color: ink.secondary },
    grid: { left: 10, right: 16, top: 18, bottom: 6, containLabel: true },
    xAxis: {
      type: "value",
      name: "households within 400 m (%)",
      nameLocation: "middle",
      nameGap: 24,
      nameTextStyle: { color: ink.muted, fontSize: 10, fontFamily: font },
      min: (v: { min: number }) => Math.floor(v.min - 4),
      max: (v: { max: number }) => Math.ceil(v.max + 4),
      axisLabel: { color: ink.muted, fontSize: 10, fontFamily: font },
      splitLine: { lineStyle: { color: "rgba(242,244,233,0.06)" } },
    },
    yAxis: {
      type: "value",
      name: "overall index (NI = 100)",
      nameTextStyle: { color: ink.muted, fontSize: 10, fontFamily: font },
      min: (v: { min: number }) => Math.floor(v.min - 1.5),
      max: (v: { max: number }) => Math.ceil(v.max + 1.5),
      axisLabel: { color: ink.muted, fontSize: 10, fontFamily: font },
      splitLine: { lineStyle: { color: "rgba(242,244,233,0.06)" } },
    },
    series: [
      {
        type: "scatter",
        symbolSize: 11,
        data: q.points.map((p) => ({
          value: [p.pct400, +p.index.toFixed(1)],
          name: p.name,
          code: p.code,
          itemStyle: {
            color: QUADRANT_META[p.quadrant].color,
            borderColor: "rgba(8,29,40,0.9)",
            borderWidth: 1,
          },
        })),
        markLine: {
          symbol: "none",
          lineStyle: { color: ink.muted, type: "dashed", width: 1 },
          label: { show: false },
          data: [{ xAxis: +q.provisionRef.toFixed(1) }, { yAxis: 100 }],
        },
      },
    ],
    tooltip: {
      backgroundColor: "rgba(8,29,40,0.94)",
      borderColor: "rgba(67,220,193,0.25)",
      textStyle: { color: ink.primary, fontFamily: font, fontSize: 12 },
      confine: true,
      formatter: (p: { name: string; value: [number, number] }) =>
        `<b>${p.name}</b><br/>Provision: ${p.value[0].toFixed(1)}% within 400 m<br/>Perception: index ${p.value[1]}`,
    },
  };
}

export function EvidenceDrawer({
  provisionByCode,
  niProvisionRef,
  vintage,
}: {
  provisionByCode: Record<string, ProvisionRecord> | null;
  niProvisionRef: number | null;
  vintage: number | null;
}) {
  const [open, setOpen] = useState(false);
  const { emphasizedCodes } = useAppState();
  const dispatch = useAppDispatch();

  const q = useMemo(
    () => (provisionByCode ? classifyQuadrants(provisionByCode, niProvisionRef) : null),
    [provisionByCode, niProvisionRef],
  );
  const option = useMemo(() => (q ? scatterOption(q) : null), [q]);
  const interpretation = useMemo(() => (q ? interpretQuadrants(q) : ""), [q]);

  const activeQuadrant: QuadrantId | null = useMemo(() => {
    if (!q || !emphasizedCodes) return null;
    const ids = Object.keys(q.byQuadrant) as QuadrantId[];
    return (
      ids.find(
        (id) =>
          q.byQuadrant[id].length === emphasizedCodes.length &&
          q.byQuadrant[id].every((p) => emphasizedCodes.includes(p.code)),
      ) ?? null
    );
  }, [q, emphasizedCodes]);

  const toggleQuadrant = (id: QuadrantId) => {
    if (!q) return;
    const codes = q.byQuadrant[id].map((p) => p.code);
    dispatch({ type: "emphasize", codes: activeQuadrant === id ? null : codes });
  };

  const onPointClick = useMemo(
    () => ({
      click: (p: unknown) => {
        const { data } = p as { data?: { code?: string } };
        if (data?.code) dispatch({ type: "select", code: data.code });
      },
    }),
    [dispatch],
  );

  if (!q) {
    return (
      <div className="evidence-drawer glass-strong collapsed-note" role="note">
        Perception and provision can be compared council-by-council once the provision
        service is reachable; until then each side stands on its own evidence.
      </div>
    );
  }

  return (
    <section className={`evidence-drawer glass-strong ${open ? "open" : ""}`} aria-label="Perception against provision, council by council">
      <button className="drawer-handle" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span>Compare the evidence — {q.points.length} councils in four quadrants</span>
        <span aria-hidden="true">{open ? "▾" : "▴"}</span>
      </button>
      {open && (
        <div className="drawer-body">
          <div className="drawer-grid">
            <div>
              {option && (
                <Chart
                  option={option}
                  className="chart-box"
                  style={{ height: 230 }}
                  onEvents={onPointClick}
                  ariaLabel="Scatter of councils: provision within 400 metres against overall perception index; click a point to select that council"
                />
              )}
              <p className="legend-note" style={{ marginTop: 4 }}>
                Reference lines: NI average index (100) and{" "}
                {q.provisionRefSource === "ni_published"
                  ? `the published NI-wide 400 m figure (${q.provisionRef.toFixed(1)}%${vintage ? `, ${vintage} vintage` : ""})`
                  : `the council median 400 m figure (${q.provisionRef.toFixed(1)}% — NI-wide figure unavailable)`}.
                "Higher / lower" are positions relative to these references, not judgements
                of adequacy; councils near a line should be read loosely given survey
                margins of error.
              </p>
            </div>
            <div>
              <div className="quadrant-buttons" role="group" aria-label="Quadrant filters">
                {(Object.keys(QUADRANT_META) as QuadrantId[]).map((id) => (
                  <button
                    key={id}
                    aria-pressed={activeQuadrant === id}
                    style={{ "--qc": QUADRANT_META[id].color } as React.CSSProperties}
                    onClick={() => toggleQuadrant(id)}
                    disabled={q.byQuadrant[id].length === 0}
                    title={q.byQuadrant[id].map((p) => p.name).join(", ") || "No councils"}
                  >
                    <b>{q.byQuadrant[id].length}</b>
                    <span>{QUADRANT_META[id].short}</span>
                  </button>
                ))}
              </div>
              <p className="drawer-interpretation">{interpretation}</p>
              <p className="legend-note">
                Click a quadrant to highlight its councils on both maps; click again to
                clear. Click a point for that council's full profile.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
