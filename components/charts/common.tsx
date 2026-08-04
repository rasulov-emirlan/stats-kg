"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { fmtCompact, fmtInt } from "@/lib/format";

/** Server components pass a key, not a function (functions can't cross the RSC boundary). */
export type FormatKey = "compact" | "compactPrecise" | "int" | "usdInt";

export const FORMATTERS: Record<FormatKey, (v: number) => string> = {
  compact: fmtCompact,
  // for narrow-range series (e.g. 7.21–7.26 млн) where 1-decimal ticks collapse
  compactPrecise: (v) =>
    Math.abs(v) >= 1_000_000
      ? `${(v / 1_000_000).toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} млн`
      : fmtCompact(v),
  int: fmtInt,
  usdInt: (v) => `$${fmtInt(v)}`,
};

export const INK = "#0a0a0a";
export const GRID = "#ececec";
export const AXIS_TEXT = "#737373";
export const SURFACE = "#fafafa";

/** Measured container width so SVG renders at real pixel size (no stretching). */
export function useContainerWidth(initial = 640) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(initial);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, width };
}

export function Tooltip({
  x,
  y,
  containerWidth,
  children,
}: {
  x: number;
  y: number;
  containerWidth: number;
  children: ReactNode;
}) {
  const flip = x > containerWidth - 140;
  return (
    <div
      className="pointer-events-none absolute z-10 border border-g300 bg-paper px-2.5 py-1.5 text-xs shadow-sm"
      style={{
        left: flip ? undefined : x + 12,
        right: flip ? containerWidth - x + 12 : undefined,
        top: Math.max(0, y - 8),
      }}
    >
      {children}
    </div>
  );
}

/** Table twin: every chart's values, reachable without hover. */
export function ChartTable({
  caption,
  head,
  rows,
}: {
  caption: string;
  head: string[];
  rows: (string | number)[][];
}) {
  return (
    <details className="method mt-2">
      <summary className="kicker text-g500 transition-colors duration-150 hover:text-red">
        таблица
      </summary>
      <div className="mt-2 max-h-72 overflow-y-auto border border-g300">
        <table className="w-full text-xs" style={{ fontVariantNumeric: "tabular-nums" }}>
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-g300 bg-g100 text-left">
              {head.map((h) => (
                <th key={h} className="px-2 py-1.5 font-medium text-g500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-g100 last:border-0">
                {r.map((c, j) => (
                  <td key={j} className="px-2 py-1">
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
