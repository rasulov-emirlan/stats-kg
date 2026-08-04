import { ArrowRight } from "lucide-react";
import Link from "next/link";

import IndexBars from "@/components/charts/index-bars";
import RegionBars from "@/components/charts/region-bars";
import TrendChart from "@/components/charts/trend-chart";
import { ExportButtons, InsightCard, NoData, StatTile } from "@/components/ui";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  attentionMultiplier,
  carsPerApartment,
  importSharePct,
  paybackYears,
  trimRampUp,
} from "@/lib/derive";
import { fmtDayShort, fmtInt, fmtKgs, fmtPct, fmtUsd, fmtX, plural } from "@/lib/format";
import { getDashboard, getDemand, getListingTotals, getSold } from "@/lib/sources/avtostat";
import {
  CATEGORY_APARTMENTS_SALE,
  getFx,
  getMarketIndex,
  getRegionsRent,
  getRegionsSale,
  getYields,
  regionName,
} from "@/lib/sources/lalafo";

export const revalidate = 600;

export default async function Home() {
  const [dash, demand, sold, totals, regionsSale, regionsRent, yields, mi, fx] =
    await Promise.all([
      getDashboard(),
      getDemand(),
      getSold(),
      getListingTotals(),
      getRegionsSale(),
      getRegionsRent(),
      getYields(),
      getMarketIndex(CATEGORY_APARTMENTS_SALE),
      getFx(),
    ]);

  const carUsd = dash?.overview.median_price_usd ?? null;
  const bishkekSale = regionsSale?.regions.find((r) => r.region === "bishkek") ?? null;
  const bishkekRent = regionsRent?.regions.find((r) => r.region === "bishkek") ?? null;
  const bishkekYield = yields?.yields.find((r) => r.region === "bishkek") ?? null;

  const ratio = carsPerApartment(bishkekSale?.medianPrice, carUsd);
  const payback = paybackYears(bishkekYield?.grossYieldPct);
  const importPct = importSharePct(totals?.all, totals?.local);
  const electro = demand?.by_fuel.find((f) => f.name === "электро") ?? null;
  const electroX = attentionMultiplier(electro?.index);

  const carsTrend = (dash?.trend ?? []).map((p) => ({
    label: fmtDayShort(p.day),
    value: p.active_count,
  }));

  const miPoints = trimRampUp(mi?.points ?? []).map((p) => ({
    label: fmtDayShort(p.takenAt),
    value: p.median,
  }));

  const regionBars = (regionsSale?.regions ?? [])
    .filter((r) => r.medianPricePerSqm != null)
    .sort((a, b) => (b.medianPricePerSqm ?? 0) - (a.medianPricePerSqm ?? 0))
    .map((r) => ({
      label: regionName(r.region),
      value: r.medianPricePerSqm as number,
      detail: `${fmtInt(r.count)} объявлений`,
    }));

  const fuelRows = (demand?.by_fuel ?? [])
    .slice()
    .sort((a, b) => b.index - a.index)
    .map((f) => ({
      label: f.name,
      index: f.index,
      detail: `${fmtInt(f.count)} объявлений в выборке`,
    }));

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Что происходит на рынках Кыргызстана
        </h1>
        <p className="mt-2 max-w-[70ch] text-sm text-muted-foreground sm:text-base">
          Каждый день мы пересчитываем{" "}
          {dash ? <strong>{fmtInt(dash.overview.active_count)}</strong> : "десятки тысяч"}{" "}
          объявлений о продаже автомобилей и{" "}
          {regionsSale ? (
            <strong>{fmtInt(regionsSale.regions.reduce((s, r) => s + r.count, 0))}</strong>
          ) : (
            "десятки тысяч"
          )}{" "}
          — о продаже квартир, чтобы простыми цифрами показать, сколько стоит жизнь в
          Кыргызстане. Без опросов и оценок — только реальные цены рынка.
        </p>
      </section>

      {ratio != null && (
        <Card>
          <CardHeader>
            <CardDescription>Главная пропорция</CardDescription>
            <CardTitle className="text-4xl tabular-nums sm:text-5xl">
              1&nbsp;квартира = {ratio.toLocaleString("ru-RU")}{" "}
              {/* fractional counts take genitive singular: 7,1 машины */}
              {Number.isInteger(ratio)
                ? plural(ratio, "машина", "машины", "машин")
                : "машины"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Медианная квартира в Бишкеке (
            {bishkekSale?.medianPrice != null ? fmtUsd(bishkekSale.medianPrice) : "—"}) стоит
            примерно как {Math.round(ratio)}{" "}
            {plural(
              Math.round(ratio),
              "медианный автомобиль",
              "медианных автомобиля",
              "медианных автомобилей"
            )}{" "}
            с местного рынка ({carUsd != null ? fmtUsd(carUsd) : "—"} за штуку).
          </CardContent>
        </Card>
      )}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {carUsd != null && (
          <StatTile
            label="Медианный автомобиль"
            value={fmtUsd(carUsd)}
            note="местные объявления, без «под заказ»"
          />
        )}
        {bishkekSale?.medianPrice != null && (
          <StatTile
            label="Квартира в Бишкеке"
            value={fmtUsd(bishkekSale.medianPrice)}
            note={`вторичка, ${fmtInt(bishkekSale.count)} объявлений`}
          />
        )}
        {bishkekRent?.medianPrice != null && (
          <StatTile
            label="Аренда в Бишкеке"
            value={`${fmtInt(bishkekRent.medianPrice)} сом`}
            note="в месяц, долгосрочная, все типы жилья"
          />
        )}
        {fx && (
          <StatTile
            label="Доллар"
            value={`${fx.latest.toLocaleString("ru-RU")} сом`}
            note="курс НБКР, стабилен весь год"
          />
        )}
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Пять цифр, которые всё объясняют</h2>
          <p className="text-sm text-muted-foreground">
            Каждая карточка — одно наблюдение на стыке двух рынков. Раскройте «как посчитано»,
            чтобы увидеть кухню.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {payback != null && bishkekYield && (
            <InsightCard
              figure={`${payback} ${plural(payback, "год", "года", "лет")}`}
              title="Окупаемость квартиры арендой"
              method={
                <>
                  Валовая доходность аренды в Бишкеке — {fmtPct(bishkekYield.grossYieldPct, 1)}{" "}
                  годовых: медианная аренда {fmtKgs(bishkekYield.medianRentKgs)}/мес против
                  медианной цены {fmtUsd(bishkekYield.medianSaleUsd)}. 100 ÷ доходность = срок
                  окупаемости, без учёта простоя, налогов и ремонта.
                </>
              }
            >
              Купить медианную квартиру в Бишкеке и сдавать её по медианной ставке — вложение
              вернётся примерно за {payback} {plural(payback, "год", "года", "лет")}.
            </InsightCard>
          )}
          {importPct != null && totals && (
            <InsightCard
              figure={fmtPct(importPct)}
              title="Машин ещё нет в стране"
              method={
                <>
                  Из {fmtInt(totals.all)} активных объявлений{" "}
                  {fmtInt(totals.all - totals.local)} — «под заказ»: машина физически за
                  границей (Китай, Корея, США…) и не прошла таможню. Такие объявления исключены
                  из медианной цены наверху.
                </>
              }
            >
              {importPct >= 30 && importPct <= 38
                ? "Каждое третье объявление"
                : `${fmtPct(importPct)} объявлений`}{" "}
              на авторынке — автомобиль «под заказ», который ещё не пересёк границу
              Кыргызстана.
            </InsightCard>
          )}
          {electroX != null && electro && (
            <InsightCard
              figure={fmtX(electroX)}
              title="Электромобили — самые желанные"
              method={
                <>
                  Индекс внимания: медианные просмотры объявления в день против медианы всего
                  рынка (за {demand?.window_days ?? 7} дней). Электро — {electro.index} против
                  100 у рынка, по {fmtInt(electro.count)} объявлениям.
                </>
              }
            >
              Объявления об электромобилях смотрят в {fmtX(electroX)} чаще, чем среднее
              объявление на рынке. Спрос на «зелёное» опережает предложение.
            </InsightCard>
          )}
          {sold && (
            <InsightCard
              figure={`${sold.median_days} ${plural(sold.median_days, "день", "дня", "дней")}`}
              title="Продать машину — неделя"
              method={
                <>
                  Медианное время от появления объявления до снятия, по{" "}
                  {fmtInt(sold.month_count)} снятым за месяц. Снятие ≈ продажа; часть уходит с
                  рынка по другим причинам.
                </>
              }
            >
              Половина машин уходит с рынка за {sold.median_days}{" "}
              {plural(sold.median_days, "день", "дня", "дней")}. Авторынок в Кыргызстане —
              один из самых быстрых рынков вообще.
            </InsightCard>
          )}
          {bishkekRent?.medianPrice != null && fx && (
            <InsightCard
              figure={fmtUsd(Math.round(bishkekRent.medianPrice / fx.latest))}
              title="Аренда в долларах"
              method={
                <>
                  Медианная долгосрочная аренда в Бишкеке {fmtKgs(bishkekRent.medianPrice)}/мес
                  по курсу НБКР {fx.latest.toLocaleString("ru-RU")}. Выборка —{" "}
                  {fmtInt(bishkekRent.count)} объявлений всех типов жилья.
                </>
              }
            >
              Снять жильё в Бишкеке стоит около{" "}
              {fmtUsd(Math.round(bishkekRent.medianPrice / fx.latest))} в месяц — и курс
              доллара весь год почти не двигался.
            </InsightCard>
          )}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Автомобили в продаже</CardTitle>
            <CardDescription>активных объявлений, последние 90 дней</CardDescription>
          </CardHeader>
          <CardContent>
            {carsTrend.length > 1 ? (
              <TrendChart
                points={carsTrend}
                format="compact"
                valueLabel="Объявлений"
                tableCaption="Активные автообъявления по дням"
              />
            ) : (
              <NoData />
            )}
          </CardContent>
          <CardFooter>
            <ExportButtons
              csv="/api/export/cars-trend"
              json="https://avtostat.kg/api/dashboard"
            />
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Цена квартир (вторичка)</CardTitle>
            <CardDescription>
              медиана по стране в сомах — серия молодая, копим историю с июля 2026
            </CardDescription>
          </CardHeader>
          <CardContent>
            {miPoints.length > 1 ? (
              <TrendChart
                points={miPoints}
                format="compactPrecise"
                valueLabel="Медиана, сом"
                tableCaption="Медианная цена квартир по дням"
              />
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Где жильё дороже</CardTitle>
          <CardDescription>
            медианная цена квадратного метра квартир на продажу, по регионам
          </CardDescription>
        </CardHeader>
        <CardContent>
          {regionBars.length > 0 ? (
            <RegionBars
              rows={regionBars}
              format="usdInt"
              valueLabel="$ за м²"
              detailLabel="Выборка"
              tableCaption="Цена квадратного метра по регионам"
            />
          ) : (
            <NoData />
          )}
        </CardContent>
        <CardFooter>
          <ExportButtons
            csv="/api/export/regions-sale"
            json="https://stats.kg/api/regions?scope=region&mode=sale"
          />
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Какие машины хотят кыргызстанцы</CardTitle>
          <CardDescription>
            индекс внимания: как часто смотрят объявления с каждым типом топлива относительно
            всего рынка (рынок = 100)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {fuelRows.length > 0 ? (
            <IndexBars
              rows={fuelRows}
              valueLabel="Индекс"
              baselineLabel="весь рынок"
              tableCaption="Индекс внимания по типу топлива"
            />
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
          <CardTitle>Копнуть глубже</CardTitle>
          <CardDescription>
            Таблицы по всем регионам, доходность аренды, потеря цены по маркам, самые желанные
            модели — и выгрузка каждого набора в CSV.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button render={<Link href="/glubzhe" />}>
            Открыть раздел <ArrowRight />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
