import type { Metadata } from "next";

import { ExportButtons, NoData } from "@/components/ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { paybackYears, trimRampUp } from "@/lib/derive";
import { fmtDayShort, fmtInt, fmtPct } from "@/lib/format";
import { getDashboard, getDemand, getSold } from "@/lib/sources/avtostat";
import {
  CATEGORY_APARTMENTS_SALE,
  getMarketIndex,
  getRegionsRent,
  getRegionsSale,
  getYields,
  regionName,
} from "@/lib/sources/lalafo";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Глубже",
  description:
    "Полные таблицы: недвижимость и аренда по регионам, доходность, потеря цены автомобилей по маркам, самые желанные модели. Всё выгружается в CSV.",
};

function NumHead({ children }: { children: React.ReactNode }) {
  return <TableHead className="text-right">{children}</TableHead>;
}

function NumCell({ children }: { children: React.ReactNode }) {
  return <TableCell className="text-right tabular-nums">{children}</TableCell>;
}

export default async function Glubzhe() {
  const [dash, demand, sold, regionsSale, regionsRent, yields, mi] = await Promise.all([
    getDashboard(),
    getDemand(),
    getSold(),
    getRegionsSale(),
    getRegionsRent(),
    getYields(),
    getMarketIndex(CATEGORY_APARTMENTS_SALE),
  ]);

  const regionTable = (regionsSale?.regions ?? []).map((s) => {
    const rent = regionsRent?.regions.find((r) => r.region === s.region);
    const y = yields?.yields.find((r) => r.region === s.region);
    return {
      region: regionName(s.region),
      saleCount: s.count,
      medianUsd: s.medianPrice,
      sqm: s.medianPricePerSqm,
      rentCount: rent?.count ?? null,
      rentKgs: rent?.medianPrice ?? null,
      yieldPct: y?.grossYieldPct ?? null,
      payback: paybackYears(y?.grossYieldPct),
    };
  });

  const miPoints = trimRampUp(mi?.points ?? []);

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Глубже</h1>
        <p className="mt-2 max-w-[70ch] text-sm text-muted-foreground sm:text-base">
          Все таблицы, из которых собраны цифры на главной, — целиком, с размерами выборок и
          выгрузкой в CSV. Кнопка «JSON» под каждым блоком ведёт на живой источник данных.
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Регионы: цены, аренда, доходность</CardTitle>
          <CardDescription>
            Продажа квартир (вторичка, USD), долгосрочная аренда (сомы) и валовая доходность —
            по каждому региону, где выборка достаточна.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {regionTable.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Регион</TableHead>
                    <NumHead>Объявл. продажи</NumHead>
                    <NumHead>Медиана, $</NumHead>
                    <NumHead>$/м²</NumHead>
                    <NumHead>Объявл. аренды</NumHead>
                    <NumHead>Аренда, сом/мес</NumHead>
                    <NumHead>Доходность</NumHead>
                    <NumHead>Окупаемость</NumHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {regionTable.map((r) => (
                    <TableRow key={r.region}>
                      <TableCell className="font-medium">{r.region}</TableCell>
                      <NumCell>{fmtInt(r.saleCount)}</NumCell>
                      <NumCell>{r.medianUsd != null ? fmtInt(r.medianUsd) : "—"}</NumCell>
                      <NumCell>{r.sqm != null ? fmtInt(r.sqm) : "—"}</NumCell>
                      <NumCell>{r.rentCount != null ? fmtInt(r.rentCount) : "—"}</NumCell>
                      <NumCell>{r.rentKgs != null ? fmtInt(r.rentKgs) : "—"}</NumCell>
                      <NumCell>{r.yieldPct != null ? fmtPct(r.yieldPct, 1) : "—"}</NumCell>
                      <NumCell>{r.payback != null ? `${r.payback} лет` : "—"}</NumCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="mt-3 max-w-[70ch] text-xs text-muted-foreground">
                Баткен отсутствует: выборка меньше порога надёжности (5 объявлений в группе).
                Малые выборки (Нарын, Талас) показываем, но доверять им стоит осторожно —
                смотрите столбцы с числом объявлений.
              </p>
            </>
          ) : (
            <NoData />
          )}
        </CardContent>
        <CardFooter>
          <ExportButtons
            csv="/api/export/regions-full"
            json="https://stats.kg/api/regions?scope=region&mode=yield"
          />
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Индекс цены квартир, все точки</CardTitle>
          <CardDescription>
            Медиана, квартили и число живых объявлений на каждый замер. Ранние замеры с
            неполным покрытием (меньше 60% от лучшего) отброшены.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {miPoints.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Замер</TableHead>
                  <NumHead>Объявлений</NumHead>
                  <NumHead>P25, сом</NumHead>
                  <NumHead>Медиана, сом</NumHead>
                  <NumHead>P75, сом</NumHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {miPoints.map((p) => (
                  <TableRow key={p.takenAt}>
                    <TableCell className="font-medium">{fmtDayShort(p.takenAt)}</TableCell>
                    <NumCell>{fmtInt(p.liveCount)}</NumCell>
                    <NumCell>{fmtInt(p.p25)}</NumCell>
                    <NumCell>{fmtInt(p.median)}</NumCell>
                    <NumCell>{fmtInt(p.p75)}</NumCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <NoData />
          )}
        </CardContent>
        <CardFooter>
          <ExportButtons
            csv="/api/export/market-index"
            json="https://stats.kg/api/market-index?category=2046"
          />
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Самые желанные и самые незаметные модели</CardTitle>
          <CardDescription>
            Индекс внимания (рынок = 100) по медианным просмотрам в день. Выборка —{" "}
            {demand ? fmtInt(demand.rated_count) : "…"} объявлений за{" "}
            {demand?.window_days ?? 7} дней.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {demand ? (
            <div className="grid gap-6 lg:grid-cols-2">
              {(
                [
                  ["Хотят", demand.most_wanted],
                  ["Игнорируют", demand.ignored],
                ] as const
              ).map(([title, rows]) => (
                <div key={title}>
                  <h3 className="mb-2 text-sm font-semibold">{title}</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Модель</TableHead>
                        <NumHead>Индекс</NumHead>
                        <NumHead>Медиана, $</NumHead>
                        <NumHead>Объявл.</NumHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.slice(0, 10).map((m) => (
                        <TableRow key={`${m.make}-${m.model}`}>
                          <TableCell className="font-medium">
                            {m.make} {m.model}
                          </TableCell>
                          <NumCell>{m.index}</NumCell>
                          <NumCell>{fmtInt(m.median_price_usd)}</NumCell>
                          <NumCell>{fmtInt(m.count)}</NumCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </div>
          ) : (
            <NoData />
          )}
        </CardContent>
        <CardFooter>
          <ExportButtons csv="/api/export/fuel-demand" json="https://avtostat.kg/api/demand" />
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Скорость продажи и цены по маркам</CardTitle>
          <CardDescription>
            Сколько машин каждой марки снято с продажи за месяц, медианные дни на рынке и
            медианная цена.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sold ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Марка</TableHead>
                    <NumHead>Продано за месяц</NumHead>
                    <NumHead>Медианные дни</NumHead>
                    <NumHead>Медиана, $</NumHead>
                    <NumHead>Потеря цены, %/год</NumHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sold.by_make.slice(0, 15).map((m) => {
                    const ret = dash?.retention.find((r) => r.make === m.make);
                    return (
                      <TableRow key={m.make}>
                        <TableCell className="font-medium">{m.make}</TableCell>
                        <NumCell>{fmtInt(m.sold_count)}</NumCell>
                        <NumCell>{m.median_days}</NumCell>
                        <NumCell>{fmtInt(m.median_price_usd)}</NumCell>
                        <NumCell>{ret ? fmtPct(ret.drop_pct_per_year, 1) : "—"}</NumCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <p className="mt-3 max-w-[70ch] text-xs text-muted-foreground">
                «Потеря цены» — среднегодовое снижение цены между соседними модельными годами
                (геометрическое среднее). Положительное значение = машина дешевеет на столько
                процентов в год; отрицательное — марка в среднем дорожает (обычно эффект
                состава выборки).
              </p>
            </>
          ) : (
            <NoData />
          )}
        </CardContent>
        <CardFooter>
          <ExportButtons csv="/api/export/sold-by-make" json="https://avtostat.kg/api/sold" />
        </CardFooter>
      </Card>
    </div>
  );
}
