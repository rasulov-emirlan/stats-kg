import { Braces, Download } from "lucide-react";
import type { ReactNode } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function StatTile({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <Card className="gap-1 py-4">
      <CardHeader className="px-4">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl tabular-nums sm:text-3xl">{value}</CardTitle>
      </CardHeader>
      {note ? (
        <CardContent className="px-4 text-xs text-muted-foreground">{note}</CardContent>
      ) : null}
    </Card>
  );
}

export function InsightCard({
  figure,
  title,
  children,
  method,
}: {
  figure: string;
  title: string;
  children: ReactNode;
  method?: ReactNode;
}) {
  return (
    <Card className="gap-2">
      <CardHeader>
        <CardTitle className="text-3xl tabular-nums">{figure}</CardTitle>
        <CardDescription className="text-base font-medium text-foreground">
          {title}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col text-sm text-muted-foreground">
        <div>{children}</div>
        {method ? (
          <Accordion className="mt-auto pt-2">
            <AccordionItem value="method" className="border-none">
              <AccordionTrigger className="py-2 text-xs text-muted-foreground">
                Как посчитано
              </AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground">
                {method}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function NoData() {
  return (
    <Alert>
      <AlertTitle>Нет данных</AlertTitle>
      <AlertDescription>
        Источник данных сейчас недоступен — блок вернётся при следующем обновлении.
      </AlertDescription>
    </Alert>
  );
}

export function ExportButtons({ csv, json }: { csv?: string; json?: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {csv ? (
        <Button variant="outline" size="sm" render={<a href={csv} />}>
          <Download /> CSV
        </Button>
      ) : null}
      {json ? (
        <Button variant="outline" size="sm" render={<a href={json} rel="nofollow" />}>
          <Braces /> JSON
        </Button>
      ) : null}
    </div>
  );
}
