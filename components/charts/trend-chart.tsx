"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { ChartTabs } from "@/components/charts/chart-tabs";
import { FORMATTERS, type FormatKey } from "@/components/charts/format";
import { fmtInt } from "@/lib/format";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export default function TrendChart({
  points,
  format: formatKey,
  valueLabel,
  tableCaption,
}: {
  points: { label: string; value: number }[];
  format: FormatKey;
  valueLabel: string;
  tableCaption: string;
}) {
  const fmt = FORMATTERS[formatKey];
  const config = {
    value: { label: valueLabel, color: "var(--chart-3)" },
  } satisfies ChartConfig;

  return (
    <ChartTabs
      caption={tableCaption}
      head={["Дата", valueLabel]}
      rows={points.map((p) => [p.label, fmtInt(p.value)])}
      chart={
        <ChartContainer config={config} className="aspect-auto h-64 w-full">
          <LineChart data={points} margin={{ left: 4, right: 12, top: 16 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={formatKey === "compactPrecise" ? 76 : 64}
              tickFormatter={(v: number) => fmt(v)}
              domain={["auto", "auto"]}
            />
            <ChartTooltip
              cursor={{ strokeDasharray: "3 3" }}
              content={
                <ChartTooltipContent
                  formatter={(value) => (
                    <div className="flex w-full items-center justify-between gap-4">
                      <span className="text-muted-foreground">{valueLabel}</span>
                      <span className="font-medium tabular-nums">{fmt(Number(value))}</span>
                    </div>
                  )}
                />
              }
            />
            <Line
              dataKey="value"
              type="monotone"
              stroke="var(--color-value)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ChartContainer>
      }
    />
  );
}
