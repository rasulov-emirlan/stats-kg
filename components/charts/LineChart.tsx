"use client";

import { useState } from "react";
import { niceTicks } from "@/lib/scale";
import {
  AXIS_TEXT,
  ChartTable,
  GRID,
  INK,
  SURFACE,
  Tooltip,
  useContainerWidth,
  FORMATTERS,
  type FormatKey,
} from "./common";

export type LinePoint = { label: string; value: number };

/**
 * Single-series line: 2px round-capped line, 10%-opacity area wash, endpoint
 * dot with surface ring + direct end label, crosshair tooltip, table twin.
 */
export default function LineChart({
  points,
  height = 220,
  format: formatKey,
  tableCaption,
  valueHeader,
  baselineZero = false,
}: {
  points: LinePoint[];
  height?: number;
  format: FormatKey;
  tableCaption: string;
  valueHeader: string;
  baselineZero?: boolean;
}) {
  const format = FORMATTERS[formatKey];
  const { ref, width } = useContainerWidth();
  const [hover, setHover] = useState<number | null>(null);

  const pad = { top: 16, right: 76, bottom: 26, left: 8 };
  const values = points.map((p) => p.value);
  const lo = baselineZero ? 0 : Math.min(...values);
  const hi = Math.max(...values);
  const ticks = niceTicks(lo, hi, 4);
  const yMin = baselineZero ? 0 : Math.min(lo, ticks[0] ?? lo);
  const yMax = Math.max(hi, ticks[ticks.length - 1] ?? hi);
  const plotW = Math.max(80, width - pad.left - pad.right);
  const plotH = height - pad.top - pad.bottom;

  const x = (i: number) =>
    pad.left + (points.length === 1 ? plotW / 2 : (i / (points.length - 1)) * plotW);
  const y = (v: number) =>
    pad.top + plotH - (yMax === yMin ? plotH / 2 : ((v - yMin) / (yMax - yMin)) * plotH);

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.value)}`).join(" ");
  const areaPath = `${linePath} L${x(points.length - 1)},${pad.top + plotH} L${x(0)},${pad.top + plotH} Z`;

  const last = points[points.length - 1];

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const i = Math.round(((px - pad.left) / plotW) * (points.length - 1));
    setHover(Math.max(0, Math.min(points.length - 1, i)));
  };

  if (points.length === 0) return null;

  return (
    <div ref={ref} className="relative">
      <svg
        width={width}
        height={height}
        role="img"
        aria-label={tableCaption}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
      >
        {ticks.map((t) =>
          t >= yMin && t <= yMax ? (
            <g key={t}>
              <line x1={pad.left} x2={pad.left + plotW} y1={y(t)} y2={y(t)} stroke={GRID} />
              <text
                x={pad.left + plotW + 6}
                y={y(t) + 3}
                fontSize={10}
                fill={AXIS_TEXT}
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {format(t)}
              </text>
            </g>
          ) : null
        )}
        <path d={areaPath} fill={INK} opacity={0.08} />
        <path d={linePath} fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {/* endpoint: surface ring + dot + direct label */}
        <circle cx={x(points.length - 1)} cy={y(last.value)} r={6} fill={SURFACE} />
        <circle cx={x(points.length - 1)} cy={y(last.value)} r={4} fill={INK} />
        <text
          x={pad.left + plotW + 6}
          y={y(last.value) - 8}
          fontSize={11}
          fontWeight={600}
          fill={INK}
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {format(last.value)}
        </text>
        <text x={x(0)} y={height - 8} fontSize={10} fill={AXIS_TEXT}>
          {points[0].label}
        </text>
        <text x={x(points.length - 1)} y={height - 8} fontSize={10} fill={AXIS_TEXT} textAnchor="end">
          {last.label}
        </text>
        {hover != null && (
          <line
            x1={x(hover)}
            x2={x(hover)}
            y1={pad.top}
            y2={pad.top + plotH}
            stroke={AXIS_TEXT}
            strokeWidth={1}
          />
        )}
        {hover != null && (
          <>
            <circle cx={x(hover)} cy={y(points[hover].value)} r={6} fill={SURFACE} />
            <circle cx={x(hover)} cy={y(points[hover].value)} r={4} fill={INK} />
          </>
        )}
      </svg>
      {hover != null && (
        <Tooltip x={x(hover)} y={y(points[hover].value)} containerWidth={width}>
          <span className="font-semibold" style={{ fontVariantNumeric: "tabular-nums" }}>
            {format(points[hover].value)}
          </span>{" "}
          <span className="text-g500">{points[hover].label}</span>
        </Tooltip>
      )}
      <ChartTable
        caption={tableCaption}
        head={["Дата", valueHeader]}
        rows={points.map((p) => [p.label, format(p.value)])}
      />
    </div>
  );
}
