"use client";

import type { ReactNode } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/** Every chart ships with its values as a table — reachable without hover, usable on touch. */
export function ChartTabs({
  chart,
  caption,
  head,
  rows,
}: {
  chart: ReactNode;
  caption: string;
  head: string[];
  rows: (string | number)[][];
}) {
  return (
    <Tabs defaultValue="chart">
      <TabsList>
        <TabsTrigger value="chart">График</TabsTrigger>
        <TabsTrigger value="table">Таблица</TabsTrigger>
      </TabsList>
      <TabsContent value="chart">{chart}</TabsContent>
      <TabsContent value="table">
        <div className="max-h-80 overflow-y-auto rounded-md border">
          <Table>
            <caption className="sr-only">{caption}</caption>
            <TableHeader>
              <TableRow>
                {head.map((h, i) => (
                  <TableHead key={h} className={i > 0 ? "text-right" : undefined}>
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={i}>
                  {r.map((c, j) => (
                    <TableCell
                      key={j}
                      className={j > 0 ? "text-right tabular-nums" : undefined}
                    >
                      {c}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </TabsContent>
    </Tabs>
  );
}
