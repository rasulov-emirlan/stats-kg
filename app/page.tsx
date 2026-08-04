import Link from "next/link";
import BarsH from "@/components/charts/BarsH";
import DeviationBars from "@/components/charts/DeviationBars";
import LineChart from "@/components/charts/LineChart";
import { ExportLinks, InsightCard, NoData, Section, StatTile } from "@/components/ui";
import {
  attentionMultiplier,
  carsPerApartment,
  importSharePct,
  paybackYears,
  trimRampUp,
} from "@/lib/derive";
import { fmtCompact, fmtDayShort, fmtInt, fmtKgs, fmtPct, fmtUsd, fmtX, plural } from "@/lib/format";
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
    <>
      {/* hero */}
      <section className="mx-auto max-w-5xl px-4 pt-14">
        <p className="kicker text-g500">{"// статистика жизни в кыргызстане"}</p>
        <h1 className="mt-2 max-w-[24ch] text-4xl font-bold sm:text-5xl">
          Что происходит на рынках <span className="text-red">страны</span>
        </h1>
        <p className="mt-4 max-w-[70ch] text-g800">
          Каждый день мы пересчитываем{" "}
          {dash ? <strong>{fmtInt(dash.overview.active_count)}</strong> : "десятки тысяч"}{" "}
          объявлений о продаже автомобилей и{" "}
          {regionsSale ? (
            <strong>{fmtInt(regionsSale.regions.reduce((s, r) => s + r.count, 0))}</strong>
          ) : (
            "десятки тысяч"
          )}{" "}
          — о продаже жилья, чтобы простыми цифрами показать, сколько стоит жизнь в
          Кыргызстане. Без опросов и оценок — только реальные цены рынка.
        </p>

        {ratio != null && (
          <div className="mt-10 border-y-4 border-ink py-8">
            <p className="kicker text-g500">{"// главная пропорция"}</p>
            <p className="mt-2 font-heading text-5xl font-bold sm:text-7xl">
              1&nbsp;квартира&nbsp;={" "}
              <span className="text-red">{ratio.toLocaleString("ru-RU")}</span>{" "}
              {plural(Math.round(ratio), "машина", "машины", "машин")}
            </p>
            <p className="mt-3 max-w-[70ch] text-g800">
              Медианная квартира в Бишкеке (
              {bishkekSale?.medianPrice != null ? fmtUsd(bishkekSale.medianPrice) : "—"}) стоит
              как {ratio.toLocaleString("ru-RU")}{" "}
              {plural(
                Math.round(ratio),
                "медианный автомобиль",
                "медианных автомобиля",
                "медианных автомобилей"
              )}{" "}
              с местного рынка ({carUsd != null ? fmtUsd(carUsd) : "—"}).
            </p>
          </div>
        )}
      </section>

      {/* stat tiles */}
      <section className="mx-auto mt-10 grid max-w-5xl grid-cols-2 gap-3 px-4 lg:grid-cols-4">
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
            value={`${fmtInt(bishkekRent.medianPrice)} сом/мес`}
            note="долгосрочная, все типы жилья"
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

      {/* insight cards */}
      <Section
        kicker="01 — инсайты"
        title="Пять цифр, которые всё объясняют"
        lead="Каждая карточка — одно наблюдение на стыке двух рынков. Раскройте «как посчитано», чтобы увидеть кухню."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
      </Section>

      {/* markets in motion */}
      <Section
        kicker="02 — динамика"
        title="Рынки в движении"
        lead="Сколько предложений на рынке прямо сейчас и как меняется цена жилья."
      >
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h3 className="font-bold">Автомобили в продаже</h3>
            <p className="mb-3 text-sm text-g500">активных объявлений, последние 90 дней</p>
            {carsTrend.length > 1 ? (
              <>
                <LineChart
                  points={carsTrend}
                  format="compact"
                  tableCaption="Активные автообъявления по дням"
                  valueHeader="Объявлений"
                />
                <ExportLinks
                  csv="/api/export/cars-trend"
                  json="https://avtostat.kg/api/dashboard"
                />
              </>
            ) : (
              <NoData />
            )}
          </div>
          <div>
            <h3 className="font-bold">Цена квартир (вторичка)</h3>
            <p className="mb-3 text-sm text-g500">
              медиана по стране в сомах — серия молодая, копим историю с июля 2026
            </p>
            {miPoints.length > 1 ? (
              <>
                <LineChart
                  points={miPoints}
                  format="compact"
                  tableCaption="Медианная цена квартир по дням"
                  valueHeader="Медиана, сом"
                />
                <ExportLinks
                  csv="/api/export/market-index"
                  json="https://stats.kg/api/market-index?category=2046"
                />
              </>
            ) : (
              <NoData />
            )}
          </div>
        </div>
      </Section>

      {/* price geography */}
      <Section
        kicker="03 — география"
        title="Где жильё дороже"
        lead="Медианная цена квадратного метра квартир на продажу, по регионам."
      >
        {regionBars.length > 0 ? (
          <>
            <BarsH
              rows={regionBars}
              format="usdInt"
              tableCaption="Цена квадратного метра по регионам"
              valueHeader="$ за м²"
              detailHeader="Выборка"
            />
            <ExportLinks
              csv="/api/export/regions-sale"
              json="https://stats.kg/api/regions?scope=region&mode=sale"
            />
          </>
        ) : (
          <NoData />
        )}
      </Section>

      {/* demand */}
      <Section
        kicker="04 — спрос"
        title="Какие машины хотят кыргызстанцы"
        lead="Индекс внимания: как часто смотрят объявления с каждым типом топлива относительно всего рынка (рынок = 100)."
      >
        {fuelRows.length > 0 ? (
          <>
            <DeviationBars
              rows={fuelRows}
              baselineLabel="весь рынок"
              tableCaption="Индекс внимания по типу топлива"
              valueHeader="Индекс"
            />
            <ExportLinks csv="/api/export/fuel-demand" json="https://avtostat.kg/api/demand" />
          </>
        ) : (
          <NoData />
        )}
      </Section>

      {/* go deeper */}
      <section className="mx-auto mt-16 max-w-5xl px-4">
        <div className="bg-ink p-8 text-paper">
          <p className="kicker text-g500">{"// для профи"}</p>
          <h2 className="mt-1 text-2xl font-bold">Копнуть глубже</h2>
          <p className="mt-2 max-w-[70ch] text-sm text-g300">
            Таблицы по всем регионам, доходность аренды, потеря цены по маркам, самые желанные
            модели — и выгрузка каждого набора в CSV.
          </p>
          <Link
            href="/glubzhe"
            className="mt-5 inline-block border-2 border-paper px-5 py-2 font-heading font-medium transition-colors duration-150 hover:border-red hover:text-red"
          >
            Открыть раздел →
          </Link>
        </div>
      </section>
    </>
  );
}
