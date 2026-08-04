import type { Metadata } from "next";
import { Section } from "@/components/ui";
import { fmtDate, fmtInt, fmtPct } from "@/lib/format";
import { getDashboard } from "@/lib/sources/avtostat";
import { getDataQuality } from "@/lib/sources/lalafo";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Методика",
  description:
    "Откуда цифры: источники данных, частота обновления, что такое медиана и какие оговорки стоит знать, читая STATS.KG.",
};

export default async function Metodika() {
  const [dash, dq] = await Promise.all([getDashboard(), getDataQuality()]);

  return (
    <>
      <section className="mx-auto max-w-3xl px-4 pt-14">
        <p className="kicker text-g500">{"// как это посчитано"}</p>
        <h1 className="mt-2 text-4xl font-bold">Методика</h1>
        <p className="mt-3 text-g800">
          Все цифры на сайте — из открытых объявлений двух крупнейших площадок страны,
          агрегированные автоматически. Здесь описано, как данные собираются, что мы с ними
          делаем и где у них границы.
        </p>

        <h2 className="mt-10 text-2xl font-bold">Источники</h2>
        <div className="mt-4 space-y-4 text-g800">
          <p>
            <strong>Автомобили — mashina.kg</strong> через наш проект{" "}
            <a href="https://avtostat.kg" className="underline decoration-g300 underline-offset-4 transition-colors duration-150 hover:text-red">
              Автостат
            </a>
            . Лёгкое обновление каждый час, полный обход рынка — каждую ночь. Сейчас в базе{" "}
            {dash ? <strong>{fmtInt(dash.overview.active_count)}</strong> : "≈54 000"} активных
            объявлений о продаже легковых машин.
          </p>
          <p>
            <strong>Недвижимость и аренда — lalafo.kg</strong> через наш проект{" "}
            <a href="https://stats.kg" className="underline decoration-g300 underline-offset-4 transition-colors duration-150 hover:text-red">
              статистики недвижимости
            </a>
            . Обновление раз в сутки: квартиры (вторичка и новостройки), дома, участки,
            долгосрочная и посуточная аренда{dq ? (
              <> — всего <strong>{fmtInt(dq.ads.live)}</strong> живых объявлений</>
            ) : null}.
          </p>
          <p>
            <strong>Курс доллара</strong> — официальный курс Национального банка КР
            (nbkr.kg), ежедневно.
          </p>
        </div>

        <h2 className="mt-10 text-2xl font-bold">Почему медиана, а не среднее</h2>
        <p className="mt-4 text-g800">
          Медиана — это цена ровно посередине рынка: половина объявлений дешевле, половина
          дороже. В отличие от среднего, её не «уносит» парой Rolls-Royce или пентхаусов. Все
          главные цифры сайта — медианы; там, где показываем разброс, добавляем квартили P25 и
          P75 (четверть рынка дешевле / дороже этих цен).
        </p>

        <h2 className="mt-10 text-2xl font-bold">Оговорки — читать обязательно</h2>
        <ul className="mt-4 list-none space-y-3 text-g800">
          {[
            <>
              <strong>Цены объявлений ≠ цены сделок.</strong> Мы видим, за сколько продавцы
              выставляют, а не за сколько реально продали. Торг в среднем срезает несколько
              процентов.
            </>,
            <>
              <strong>«Под заказ» исключён из цен.</strong> Около трети автообъявлений — машины
              ещё за границей. В медианную цену автомобиля они не входят, но в счётчике
              объявлений на рынке присутствуют.
            </>,
            <>
              <strong>Платное продвижение искажает просмотры.</strong> Площадки продают
              поднятие объявлений, поэтому индексы внимания строятся на медианах групп, а не на
              отдельных «горячих» объявлениях.
            </>,
            <>
              <strong>Дубли и перепосты.</strong> Продавцы переразмещают объявления;{" "}
              {dq ? fmtPct(dq.ads.duplicateSharePct, 1) : "≈12%"} повторов в недвижимости
              схлопываются до одного объявления.
            </>,
            <>
              <strong>Малые группы скрываются.</strong> Если в регионе меньше 5 сопоставимых
              объявлений, цифру не показываем совсем — лучше «нет данных», чем случайное число.
              Выбросы отсекаются межквартильным фильтром.
            </>,
            <>
              <strong>История цен жилья короткая.</strong> Индекс цены квартир мы считаем с
              конца июля 2026 — первые замеры с неполным покрытием рынка отброшены (порог 60%
              от лучшего замера). Через полгода серия станет по-настоящему интересной.
            </>,
            <>
              <strong>Снятие объявления ≈ продажа.</strong> «Дни до продажи» — это время до
              исчезновения объявления. Часть машин не продана, а просто снята — на медиану это
              влияет слабо.
            </>,
          ].map((item, i) => (
            <li key={i} className="border-l-2 border-red pl-4">
              {item}
            </li>
          ))}
        </ul>
      </section>

      <Section
        kicker="свежесть данных"
        title="Когда что обновлялось"
        lead="Живой статус обоих источников — эта таблица сама обновляется каждые 10 минут."
      >
        <div className="max-w-3xl overflow-x-auto border border-g300">
          <table className="w-full text-sm">
            <thead className="bg-g100 text-left">
              <tr>
                <th className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-g500">
                  Источник
                </th>
                <th className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-g500">
                  Последняя синхронизация
                </th>
                <th className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-g500">
                  Объём
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-g100">
                <td className="px-3 py-2">Автомобили (mashina.kg)</td>
                <td className="px-3 py-2" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {dash ? fmtDate(dash.overview.last_sync_at) : "—"}
                </td>
                <td className="px-3 py-2" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {dash ? `${fmtInt(dash.overview.active_count)} активных` : "—"}
                </td>
              </tr>
              <tr className="border-t border-g100">
                <td className="px-3 py-2">Недвижимость (lalafo.kg)</td>
                <td className="px-3 py-2" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {dq ? fmtDate(dq.lastSync.finishedAt) : "—"}
                </td>
                <td className="px-3 py-2" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {dq ? `${fmtInt(dq.ads.live)} живых` : "—"}
                </td>
              </tr>
              <tr className="border-t border-g100">
                <td className="px-3 py-2">Курс НБКР</td>
                <td className="px-3 py-2" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {dq ? fmtDate(dq.fx.latestDay) : "—"}
                </td>
                <td className="px-3 py-2" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {dq ? `${dq.fx.latestRate.toLocaleString("ru-RU")} сом/$` : "—"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 max-w-3xl text-sm text-g500">
          Проект независимый и некоммерческий, с площадками не аффилирован. Вопросы и идеи —
          в разделы «Автостат» и «Недвижимость», у обоих проектов открытые данные-агрегаты.
        </p>
      </Section>
    </>
  );
}
