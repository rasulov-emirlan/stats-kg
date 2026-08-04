"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";

import { ChartTabs } from "@/components/charts/chart-tabs";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { fmtInt } from "@/lib/format";

/** Bars around a baseline of 100 (= весь рынок): index above/below market average. */
export default function IndexBars({
  rows,
  valueLabel,
  baselineLabel,
  tableCaption,
}: {
  rows: { label: string; index: number; detail: string }[];
  valueLabel: string;
  baselineLabel: string;
  tableCaption: string;
}) {
  const config = {
    index: { label: valueLabel, color: "var(--chart-3)" },
  } satisfies ChartConfig;

  return (
    <ChartTabs
      caption={tableCaption}
      head={["Группа", valueLabel, "Выборка"]}
      rows={rows.map((r) => [r.label, r.index, r.detail])}
      chart={
        <ChartContainer
          config={config}
          className="aspect-auto w-full"
          style={{ height: rows.length * 40 + 24 }}
        >
          <BarChart data={rows} layout="vertical" margin={{ left: 4, right: 48, top: 20 }}>
            <CartesianGrid horizontal={false} />
            <XAxis type="number" hide domain={[0, "auto"]} />
            <YAxis
              dataKey="label"
              type="category"
              tickLine={false}
              axisLine={false}
              width={90}
              tick={{ fontSize: 12 }}
            />
            <ReferenceLine
              x={100}
              stroke="var(--muted-foreground)"
              strokeDasharray="4 4"
              label={{
                value: `100 — ${baselineLabel}`,
                position: "top",
                fontSize: 11,
                fill: "var(--muted-foreground)",
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value, _name, _item, _index, payload) => (
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium tabular-nums">
                        {fmtInt(Number(value))} (рынок = 100)
                      </span>
                      <span className="text-muted-foreground">
                        {(payload as { detail?: string })?.detail}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Bar dataKey="index" fill="var(--color-index)" radius={4} maxBarSize={24}>
              <LabelList
                dataKey="index"
                position="right"
                className="fill-foreground tabular-nums"
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      }
    />
  );
}
