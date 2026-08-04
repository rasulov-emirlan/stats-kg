import type { Metadata } from "next";
import { ExportLinks, NoData, Section } from "@/components/ui";
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

function Th({ children, num = false }: { children: React.ReactNode; num?: boolean }) {
  return (
    <th
      className={`border-b border-ink px-3 py-2 text-xs font-medium uppercase tracking-wide text-g500 ${num ? "text-right" : "text-left"}`}
    >
      {children}
    </th>
  );
}

function Td({ children, num = false }: { children: React.ReactNode; num?: boolean }) {
  return (
    <td
      className={`border-b border-g100 px-3 py-2 text-sm ${num ? "text-right" : "text-left"}`}
      style={num ? { fontVariantNumeric: "tabular-nums" } : undefined}
    >
      {children}
    </td>
  );
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
    <>
      <section className="mx-auto max-w-5xl px-4 pt-14">
        <p className="kicker text-g500">{"// раздел для профи"}</p>
        <h1 className="mt-2 text-4xl font-bold">Глубже</h1>
        <p className="mt-3 max-w-[70ch] text-g800">
          Все таблицы, из которых собраны цифры на главной, — целиком, с размерами выборок и
          выгрузкой в CSV. Ссылка «JSON» под каждым блоком ведёт на живой источник данных.
        </p>
      </section>

      <Section
        kicker="A — недвижимость"
        title="Регионы: цены, аренда, доходность"
        lead="Продажа квартир (вторичка, USD), долгосрочная аренда (сомы) и валовая доходность — по каждому региону, где выборка достаточна."
      >
        {regionTable.length > 0 ? (
          <>
            <div className="overflow-x-auto border border-g300">
              <table className="w-full">
                <thead className="bg-g100">
                  <tr>
                    <Th>Регион</Th>
                    <Th num>Объявл. продажи</Th>
                    <Th num>Медиана, $</Th>
                    <Th num>$/м²</Th>
                    <Th num>Объявл. аренды</Th>
                    <Th num>Аренда, сом/мес</Th>
                    <Th num>Доходность</Th>
                    <Th num>Окупаемость</Th>
                  </tr>
                </thead>
                <tbody>
                  {regionTable.map((r) => (
                    <tr key={r.region} className="hover:bg-g100">
                      <Td>{r.region}</Td>
                      <Td num>{fmtInt(r.saleCount)}</Td>
                      <Td num>{r.medianUsd != null ? fmtInt(r.medianUsd) : "—"}</Td>
                      <Td num>{r.sqm != null ? fmtInt(r.sqm) : "—"}</Td>
                      <Td num>{r.rentCount != null ? fmtInt(r.rentCount) : "—"}</Td>
                      <Td num>{r.rentKgs != null ? fmtInt(r.rentKgs) : "—"}</Td>
                      <Td num>{r.yieldPct != null ? fmtPct(r.yieldPct, 1) : "—"}</Td>
                      <Td num>{r.payback != null ? `${r.payback} лет` : "—"}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ExportLinks
              csv="/api/export/regions-full"
              json="https://stats.kg/api/regions?scope=region&mode=yield"
            />
            <p className="mt-2 max-w-[70ch] text-xs text-g500">
              Баткен отсутствует: выборка меньше порога надёжности (5 объявлений в группе).
              Малые выборки (Нарын, Талас) показываем, но доверять им стоит осторожно —
              смотрите столбцы с числом объявлений.
            </p>
          </>
        ) : (
          <NoData />
        )}
      </Section>

      <Section
        kicker="B — недвижимость"
        title="Индекс цены квартир, все точки"
        lead="Медиана, квартили и число живых объявлений на каждый замер. Ранние замеры с неполным покрытием (меньше 60% от лучшего) отброшены."
      >
        {miPoints.length > 0 ? (
          <>
            <div className="overflow-x-auto border border-g300">
              <table className="w-full">
                <thead className="bg-g100">
                  <tr>
                    <Th>Замер</Th>
                    <Th num>Объявлений</Th>
                    <Th num>P25, сом</Th>
                    <Th num>Медиана, сом</Th>
                    <Th num>P75, сом</Th>
                  </tr>
                </thead>
                <tbody>
                  {miPoints.map((p) => (
                    <tr key={p.takenAt} className="hover:bg-g100">
                      <Td>{fmtDayShort(p.takenAt)}</Td>
                      <Td num>{fmtInt(p.liveCount)}</Td>
                      <Td num>{fmtInt(p.p25)}</Td>
                      <Td num>{fmtInt(p.median)}</Td>
                      <Td num>{fmtInt(p.p75)}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ExportLinks
              csv="/api/export/market-index"
              json="https://stats.kg/api/market-index?category=2046"
            />
          </>
        ) : (
          <NoData />
        )}
      </Section>

      <Section
        kicker="C — автомобили"
        title="Самые желанные и самые незаметные модели"
        lead={`Индекс внимания (рынок = 100) по медианным просмотрам в день. Выборка — ${demand ? fmtInt(demand.rated_count) : "…"} объявлений за ${demand?.window_days ?? 7} дней.`}
      >
        {demand ? (
          <>
            <div className="grid gap-6 lg:grid-cols-2">
              {(
                [
                  ["Хотят", demand.most_wanted],
                  ["Игнорируют", demand.ignored],
                ] as const
              ).map(([title, rows]) => (
                <div key={title}>
                  <h3 className="mb-2 font-bold">{title}</h3>
                  <div className="overflow-x-auto border border-g300">
                    <table className="w-full">
                      <thead className="bg-g100">
                        <tr>
                          <Th>Модель</Th>
                          <Th num>Индекс</Th>
                          <Th num>Медиана, $</Th>
                          <Th num>Объявл.</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.slice(0, 10).map((m) => (
                          <tr key={`${m.make}-${m.model}`} className="hover:bg-g100">
                            <Td>
                              {m.make} {m.model}
                            </Td>
                            <Td num>{m.index}</Td>
                            <Td num>{fmtInt(m.median_price_usd)}</Td>
                            <Td num>{fmtInt(m.count)}</Td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
            <ExportLinks csv="/api/export/fuel-demand" json="https://avtostat.kg/api/demand" />
          </>
        ) : (
          <NoData />
        )}
      </Section>

      <Section
        kicker="D — автомобили"
        title="Скорость продажи и цены по маркам"
        lead="Сколько машин каждой марки снято с продажи за месяц, медианные дни на рынке и медианная цена."
      >
        {sold ? (
          <>
            <div className="overflow-x-auto border border-g300">
              <table className="w-full">
                <thead className="bg-g100">
                  <tr>
                    <Th>Марка</Th>
                    <Th num>Продано за месяц</Th>
                    <Th num>Медианные дни</Th>
                    <Th num>Медиана, $</Th>
                    <Th num>Потеря цены, %/год</Th>
                  </tr>
                </thead>
                <tbody>
                  {sold.by_make.slice(0, 15).map((m) => {
                    const ret = dash?.retention.find((r) => r.make === m.make);
                    return (
                      <tr key={m.make} className="hover:bg-g100">
                        <Td>{m.make}</Td>
                        <Td num>{fmtInt(m.sold_count)}</Td>
                        <Td num>{m.median_days}</Td>
                        <Td num>{fmtInt(m.median_price_usd)}</Td>
                        <Td num>
                          {ret ? fmtPct(ret.drop_pct_per_year, 1) : "—"}
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <ExportLinks csv="/api/export/sold-by-make" json="https://avtostat.kg/api/sold" />
            <p className="mt-2 max-w-[70ch] text-xs text-g500">
              «Потеря цены» — среднегодовое снижение цены между соседними модельными годами
              (геометрическое среднее). Положительное значение = машина дешевеет на столько
              процентов в год; отрицательное — марка в среднем дорожает (обычно эффект состава
              выборки).
            </p>
          </>
        ) : (
          <NoData />
        )}
      </Section>
    </>
  );
}
