"use client";

import { useState } from "react";
import {
  ChartTable,
  FORMATTERS,
  type FormatKey,
  GRID,
  INK,
  Tooltip,
  useContainerWidth,
} from "./common";

export type BarRow = { label: string; value: number; detail?: string };

/**
 * Horizontal single-series bars: ≤20px thick, 4px rounded data-end (square at
 * the baseline), value at the tip, per-mark hover tooltip, table twin.
 */
export default function BarsH({
  rows,
  format: formatKey,
  tableCaption,
  valueHeader,
  detailHeader,
}: {
  rows: BarRow[];
  format: FormatKey;
  tableCaption: string;
  valueHeader: string;
  detailHeader?: string;
}) {
  const format = FORMATTERS[formatKey];
  const { ref, width } = useContainerWidth();
  const [hover, setHover] = useState<number | null>(null);

  const labelW = Math.min(150, Math.max(90, width * 0.24));
  const valueW = 70;
  const barH = 20;
  const rowH = 32;
  const pad = { top: 4, bottom: 4 };
  const height = pad.top + rows.length * rowH + pad.bottom;
  const plotW = Math.max(60, width - labelW - valueW);
  const max = Math.max(...rows.map((r) => r.value), 0);

  const barPath = (w: number, yTop: number) => {
    const r = Math.min(4, w);
    return `M${labelW},${yTop} h${w - r} a${r},${r} 0 0 1 ${r},${r} v${barH - 2 * r} a${r},${r} 0 0 1 -${r},${r} h-${w - r} Z`;
  };

  if (rows.length === 0) return null;

  return (
    <div ref={ref} className="relative">
      <svg width={width} height={height} role="img" aria-label={tableCaption}>
        <line
          x1={labelW}
          x2={labelW}
          y1={pad.top}
          y2={height - pad.bottom}
          stroke={GRID}
        />
        {rows.map((row, i) => {
          const yTop = pad.top + i * rowH + (rowH - barH) / 2;
          const w = max === 0 ? 0 : (row.value / max) * plotW;
          return (
            <g
              key={row.label}
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover(null)}
            >
              {/* hit target wider than the mark */}
              <rect x={0} y={pad.top + i * rowH} width={width} height={rowH} fill="transparent" />
              <text
                x={labelW - 8}
                y={yTop + barH / 2 + 4}
                fontSize={12}
                textAnchor="end"
                fill={INK}
              >
                {row.label}
              </text>
              <path d={barPath(Math.max(2, w), yTop)} fill={INK} opacity={hover === i ? 0.75 : 1} />
              <text
                x={labelW + Math.max(2, w) + 6}
                y={yTop + barH / 2 + 4}
                fontSize={11}
                fontWeight={600}
                fill={INK}
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {format(row.value)}
              </text>
            </g>
          );
        })}
      </svg>
      {hover != null && (
        <Tooltip
          x={labelW + 40}
          y={pad.top + hover * rowH}
          containerWidth={width}
        >
          <span className="font-semibold" style={{ fontVariantNumeric: "tabular-nums" }}>
            {format(rows[hover].value)}
          </span>{" "}
          <span className="text-g500">{rows[hover].label}</span>
          {rows[hover].detail ? (
            <span className="block text-g500">{rows[hover].detail}</span>
          ) : null}
        </Tooltip>
      )}
      <ChartTable
        caption={tableCaption}
        head={detailHeader ? ["", valueHeader, detailHeader] : ["", valueHeader]}
        rows={rows.map((r) =>
          detailHeader ? [r.label, format(r.value), r.detail ?? ""] : [r.label, format(r.value)]
        )}
      />
    </div>
  );
}
