import { useEffect, useRef } from "react";
import * as echarts from "echarts/core";
import { BarChart, LineChart, RadarChart } from "echarts/charts";
import {
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  TooltipComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import type { EChartsCoreOption, ECharts } from "echarts/core";

echarts.use([
  BarChart,
  LineChart,
  RadarChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  MarkLineComponent,
  CanvasRenderer,
]);

interface Props {
  option: EChartsCoreOption;
  className?: string;
  onEvents?: Record<string, (params: unknown) => void>;
  ariaLabel?: string;
}

export function Chart({ option, className, onEvents, ariaLabel }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ECharts | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current, undefined, { renderer: "canvas" });
    chartRef.current = chart;
    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(ref.current);
    return () => {
      ro.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    chartRef.current?.setOption(option, { notMerge: true });
  }, [option]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !onEvents) return;
    const entries = Object.entries(onEvents);
    entries.forEach(([evt, cb]) => chart.on(evt, cb));
    return () => entries.forEach(([evt, cb]) => chart.off(evt, cb));
  }, [onEvents]);

  return <div ref={ref} className={className} role="img" aria-label={ariaLabel} />;
}
