import { Code2, Landmark, Newspaper, Users } from "lucide-react";
import type { Metadata } from "next";

import { ExportButtons, NoData } from "@/components/ui";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { freshness } from "@/fetcher/core.mjs";
import { attentionMultiplier, paybackYears } from "@/lib/derive";
import { AUDIENCES, DATASETS, type Audience } from "@/lib/datasets";
import { fmtDate, fmtInt, fmtPct, fmtUsd } from "@/lib/format";
import { getDashboard, getDemand } from "@/lib/sources/avtostat";
import { getRegionsSale, getYields, regionName } from "@/lib/sources/lalafo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Данные",
  description:
    "Сводки и открытые наборы данных STATS.KG для читателей, журналистов, бизнеса и разработчиков: CSV, JSON и API.",
};

const ICONS: Record<Audience, typeof Users> = {
  public: Users,
  press: Newspaper,
  business: Landmark,
  dev: Code2,
};

function Section({
  id,
  audience,
  lead,
  children,
}: {
  id: Audience;
  audience: Audience;
  lead: string;
  children: React.ReactNode;
}) {
  const Icon = ICONS[audience];
  return (
    <Card id={id}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="size-5" /> {AUDIENCES[audience]}
        </CardTitle>
        <CardDescription>{lead}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">{children}</CardContent>
    </Card>
  );
}

function DatasetList({ audience }: { audience: Audience }) {
  return (
    <ul className="divide-y rounded-lg border">
      {DATASETS.filter((d) => d.audiences.includes(audience)).map((d) => (
        <li key={d.slug} className="flex flex-wrap items-center justify-between gap-3 p-3">
          <div className="min-w-0">
            <div className="font-medium">{d.title}</div>
            <div className="text-muted-foreground">{d.about}</div>
          </div>
          <ExportButtons csv={`/api/export/${d.slug}`} json={`/api/export/${d.slug}?format=json`} />
        </li>
      ))}
    </ul>
  );
}

export default async function Dannye() {
  const [dash, demand, sale, yields, fresh] = await Promise.all([
    getDashboard(),
    getDemand(),
    getRegionsSale(),
    getYields(),
    freshness(process.env.DATA_DIR ?? "/data"),
  ]);

  const newest = fresh.items.map((i) => i.fetchedAt).filter(Boolean).sort().at(-1) ?? null;
  const topYield = yields ? [...yields.yields].sort((a, b) => b.grossYieldPct - a.grossYieldPct)[0] : null;
  const priciest = sale
    ? [...sale.regions].filter((r) => r.medianPricePerSqm).sort((a, b) => b.medianPricePerSqm! - a.medianPricePerSqm!)[0]
    : null;
  const cheapest = sale
    ? [...sale.regions].filter((r) => r.medianPricePerSqm && r.count >= 20).sort((a, b) => a.medianPricePerSqm! - b.medianPricePerSqm!)[0]
    : null;
  const hot = demand?.most_wanted[0];

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Данные</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground sm:text-base">
          Один и тот же рынок — четыре способа прочитать. Всё открыто под CC BY 4.0: можно
          брать, считать и публиковать со ссылкой на STATS.KG.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(Object.keys(AUDIENCES) as Audience[]).map((a) => (
            <a key={a} href={`#${a}`}>
              <Badge variant="outline">{AUDIENCES[a]}</Badge>
            </a>
          ))}
          <Badge variant={fresh.ok ? "secondary" : "destructive"}>
            {fresh.ok ? "Данные свежие" : "Данные устарели"}
            {newest ? ` · обновлено ${fmtDate(newest)}` : ""}
          </Badge>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section id="public" audience="public" lead="Коротко: что сейчас происходит.">
          {dash ? (
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                В продаже <strong>{fmtInt(dash.overview.active_count)}</strong> легковых машин, за
                неделю добавилось {fmtInt(dash.overview.added_week)}.
              </li>
              <li>
                Типичная цена местной машины — <strong>{fmtUsd(dash.overview.median_price_usd)}</strong>,
                типичный год — {dash.overview.median_year}.
              </li>
              {priciest ? (
                <li>
                  Самые дорогие квартиры — {regionName(priciest.region)}:{" "}
                  <strong>{fmtUsd(priciest.medianPricePerSqm!)}</strong> за м².
                </li>
              ) : null}
              {cheapest ? (
                <li>
                  Самые доступные — {regionName(cheapest.region)}: {fmtUsd(cheapest.medianPricePerSqm!)} за м².
                </li>
              ) : null}
            </ul>
          ) : (
            <NoData />
          )}
          <DatasetList audience="public" />
        </Section>

        <Section id="press" audience="press" lead="Что можно цитировать и с какими оговорками.">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              Цены — <strong>цены в объявлениях</strong>, а не сделок. Продавцы обычно торгуются.
            </li>
            <li>Мы считаем медианы, а не средние: редкие дорогие лоты их не двигают.</li>
            <li>
              Снятое объявление не равно продаже: объявления на mashina.kg истекают через 20 дней.
            </li>
            {hot ? (
              <li>
                Больше всего внимания у {hot.make} {hot.model}: смотрят в{" "}
                {attentionMultiplier(hot.index)?.toString().replace(".", ",")}× чаще обычного.
              </li>
            ) : null}
          </ul>
          <p className="rounded-lg bg-muted p-3">
            Как сослаться: «STATS.KG, по открытым объявлениям mashina.kg и lalafo.kg, дата
            обращения {fmtDate(newest ?? new Date().toISOString())}».
          </p>
          <DatasetList audience="press" />
        </Section>

        <Section id="business" audience="business" lead="Где цифры превращаются в решения.">
          {topYield ? (
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                Лучшая доходность аренды — {regionName(topYield.region)}:{" "}
                <strong>{fmtPct(topYield.grossYieldPct, 1)}</strong> в год, окупаемость ≈{" "}
                {paybackYears(topYield.grossYieldPct)?.toFixed(0)} лет.
              </li>
              {dash?.liquidity[0] ? (
                <li>
                  Быстрее всех продаётся {dash.liquidity[0].make} {dash.liquidity[0].model}:{" "}
                  {dash.liquidity[0].median_days} дн. до продажи.
                </li>
              ) : null}
            </ul>
          ) : (
            <NoData />
          )}
          <DatasetList audience="business" />
        </Section>

        <Section id="dev" audience="dev" lead="Без ключей, с CORS, обновляется каждый час.">
          <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs leading-relaxed">{`# каталог наборов
curl https://statskg.night.enkiduck.com/api/v1/datasets

# набор в JSON или CSV
curl "https://statskg.night.enkiduck.com/api/export/regions-full?format=json"
curl -O -J https://statskg.night.enkiduck.com/api/export/regions-full

# свежесть данных (503, если старше 3 часов)
curl https://statskg.night.enkiduck.com/api/health`}</pre>
          <DatasetList audience="dev" />
        </Section>
      </div>
    </div>
  );
}
