"use client";

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";

import { ChartTabs } from "@/components/charts/chart-tabs";
import { FORMATTERS, type FormatKey } from "@/components/charts/format";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export default function RegionBars({
  rows,
  format: formatKey,
  valueLabel,
  detailLabel,
  tableCaption,
}: {
  rows: { label: string; value: number; detail: string }[];
  format: FormatKey;
  valueLabel: string;
  detailLabel: string;
  tableCaption: string;
}) {
  const fmt = FORMATTERS[formatKey];
  const config = {
    value: { label: valueLabel, color: "var(--chart-3)" },
  } satisfies ChartConfig;

  return (
    <ChartTabs
      caption={tableCaption}
      head={["Регион", valueLabel, detailLabel]}
      rows={rows.map((r) => [r.label, fmt(r.value), r.detail])}
      chart={
        <ChartContainer
          config={config}
          className="aspect-auto w-full"
          style={{ height: rows.length * 40 + 24 }}
        >
          <BarChart data={rows} layout="vertical" margin={{ left: 4, right: 48 }}>
            <CartesianGrid horizontal={false} />
            <XAxis type="number" hide />
            <YAxis
              dataKey="label"
              type="category"
              tickLine={false}
              axisLine={false}
              width={110}
              tick={{ fontSize: 12 }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value, _name, _item, _index, payload) => (
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium tabular-nums">{fmt(Number(value))}</span>
                      <span className="text-muted-foreground">
                        {(payload as { detail?: string })?.detail}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Bar dataKey="value" fill="var(--color-value)" radius={4} maxBarSize={24}>
              <LabelList
                dataKey="value"
                position="right"
                className="fill-foreground tabular-nums"
                fontSize={12}
                formatter={(v) => fmt(Number(v))}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      }
    />
  );
}
