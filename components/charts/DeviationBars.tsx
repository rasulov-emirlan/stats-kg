"use client";

import { useState } from "react";
import { AXIS_TEXT, ChartTable, GRID, INK, Tooltip, useContainerWidth } from "./common";

export type DeviationRow = { label: string; index: number; detail?: string };

/**
 * Horizontal deviation bars around a baseline (index = 100). Direction carries
 * the sign, so a single ink series stays legible: right = above market,
 * left = below. Value at the tip, per-mark tooltip, table twin.
 */
export default function DeviationBars({
  rows,
  baseline = 100,
  baselineLabel,
  tableCaption,
  valueHeader,
}: {
  rows: DeviationRow[];
  baseline?: number;
  baselineLabel: string;
  tableCaption: string;
  valueHeader: string;
}) {
  const { ref, width } = useContainerWidth();
  const [hover, setHover] = useState<number | null>(null);

  const labelW = Math.min(140, Math.max(90, width * 0.22));
  const barH = 20;
  const rowH = 32;
  const padTop = 18;
  const height = padTop + rows.length * rowH + 6;
  const plotW = Math.max(80, width - labelW - 54);
  const maxDev = Math.max(...rows.map((r) => Math.abs(r.index - baseline)), 1);
  const cx = labelW + plotW / 2;
  const scale = plotW / 2 / maxDev;

  const barPath = (dev: number, yTop: number) => {
    const w = Math.max(2, Math.abs(dev) * scale);
    const r = Math.min(4, w);
    if (dev >= 0) {
      return `M${cx},${yTop} h${w - r} a${r},${r} 0 0 1 ${r},${r} v${barH - 2 * r} a${r},${r} 0 0 1 -${r},${r} h-${w - r} Z`;
    }
    return `M${cx},${yTop} h-${w - r} a${r},${r} 0 0 0 -${r},${r} v${barH - 2 * r} a${r},${r} 0 0 0 ${r},${r} h${w - r} Z`;
  };

  if (rows.length === 0) return null;

  return (
    <div ref={ref} className="relative">
      <svg width={width} height={height} role="img" aria-label={tableCaption}>
        <line x1={cx} x2={cx} y1={padTop - 4} y2={height - 4} stroke={GRID} />
        <text x={cx} y={10} fontSize={10} fill={AXIS_TEXT} textAnchor="middle">
          {baseline} — {baselineLabel}
        </text>
        {rows.map((row, i) => {
          const yTop = padTop + i * rowH + (rowH - barH) / 2;
          const dev = row.index - baseline;
          const tipX = cx + (dev >= 0 ? 1 : -1) * (Math.max(2, Math.abs(dev) * scale) + 6);
          return (
            <g
              key={row.label}
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover(null)}
            >
              <rect x={0} y={padTop + i * rowH} width={width} height={rowH} fill="transparent" />
              <text
                x={labelW - 8}
                y={yTop + barH / 2 + 4}
                fontSize={12}
                textAnchor="end"
                fill={INK}
              >
                {row.label}
              </text>
              <path d={barPath(dev, yTop)} fill={INK} opacity={hover === i ? 0.75 : 1} />
              <text
                x={tipX}
                y={yTop + barH / 2 + 4}
                fontSize={11}
                fontWeight={600}
                fill={INK}
                textAnchor={dev >= 0 ? "start" : "end"}
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {row.index}
              </text>
            </g>
          );
        })}
      </svg>
      {hover != null && (
        <Tooltip x={cx} y={padTop + hover * rowH} containerWidth={width}>
          <span className="font-semibold" style={{ fontVariantNumeric: "tabular-nums" }}>
            {rows[hover].index}
          </span>{" "}
          <span className="text-g500">{rows[hover].label}</span>
          {rows[hover].detail ? (
            <span className="block text-g500">{rows[hover].detail}</span>
          ) : null}
        </Tooltip>
      )}
      <ChartTable
        caption={tableCaption}
        head={["", valueHeader]}
        rows={rows.map((r) => [r.label, r.index])}
      />
    </div>
  );
}
