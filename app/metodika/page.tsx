import type { Metadata } from "next";

import {
  Card,
  CardContent,
  CardDescription,
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
    <div className="max-w-3xl space-y-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Методика</h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Все цифры на сайте — из открытых объявлений двух крупнейших площадок страны,
          агрегированные автоматически. Здесь описано, как данные собираются, что мы с ними
          делаем и где у них границы.
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Источники</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>
            <strong>Автомобили — mashina.kg</strong> через наш проект{" "}
            <a href="https://avtostat.kg" className="underline underline-offset-4">
              Автостат
            </a>
            . Лёгкое обновление каждый час, полный обход рынка — каждую ночь. Сейчас в базе{" "}
            {dash ? <strong>{fmtInt(dash.overview.active_count)}</strong> : "≈54 000"} активных
            объявлений о продаже легковых машин.
          </p>
          <p>
            <strong>Недвижимость и аренда — lalafo.kg</strong> через наш проект{" "}
            <a href="https://stats.kg" className="underline underline-offset-4">
              статистики недвижимости
            </a>
            . Обновление раз в сутки: квартиры (вторичка и новостройки), дома, участки,
            долгосрочная и посуточная аренда
            {dq ? (
              <>
                {" "}
                — всего <strong>{fmtInt(dq.ads.live)}</strong> живых объявлений
              </>
            ) : null}
            .
          </p>
          <p>
            <strong>Курс доллара</strong> — официальный курс Национального банка КР (nbkr.kg),
            ежедневно.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Почему медиана, а не среднее</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          Медиана — это цена ровно посередине рынка: половина объявлений дешевле, половина
          дороже. В отличие от среднего, её не «уносит» парой Rolls-Royce или пентхаусов. Все
          главные цифры сайта — медианы; там, где показываем разброс, добавляем квартили P25 и
          P75 (четверть рынка дешевле / дороже этих цен).
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Оговорки — читать обязательно</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm">
            {[
              <>
                <strong>Цены объявлений ≠ цены сделок.</strong> Мы видим, за сколько продавцы
                выставляют, а не за сколько реально продали. Торг в среднем срезает несколько
                процентов.
              </>,
              <>
                <strong>«Под заказ» исключён из цен.</strong> Около трети автообъявлений —
                машины ещё за границей. В медианную цену автомобиля они не входят, но в
                счётчике объявлений на рынке присутствуют.
              </>,
              <>
                <strong>Платное продвижение искажает просмотры.</strong> Площадки продают
                поднятие объявлений, поэтому индексы внимания строятся на медианах групп, а не
                на отдельных «горячих» объявлениях.
              </>,
              <>
                <strong>Дубли и перепосты.</strong> Продавцы переразмещают объявления;{" "}
                {dq ? fmtPct(dq.ads.duplicateSharePct, 1) : "≈12%"} повторов в недвижимости
                схлопываются до одного объявления.
              </>,
              <>
                <strong>Малые группы скрываются.</strong> Если в регионе меньше 5 сопоставимых
                объявлений, цифру не показываем совсем — лучше «нет данных», чем случайное
                число. Выбросы отсекаются межквартильным фильтром.
              </>,
              <>
                <strong>История цен жилья короткая.</strong> Индекс цены квартир мы считаем с
                конца июля 2026 — первые замеры с неполным покрытием рынка отброшены (порог
                60% от лучшего замера). Через полгода серия станет по-настоящему интересной.
              </>,
              <>
                <strong>Снятие объявления ≈ продажа.</strong> «Дни до продажи» — это время до
                исчезновения объявления. Часть машин не продана, а просто снята — на медиану
                это влияет слабо.
              </>,
            ].map((item, i) => (
              <li key={i} className="border-l-2 pl-4">
                {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Когда что обновлялось</CardTitle>
          <CardDescription>
            Живой статус обоих источников — эта таблица сама обновляется каждые 10 минут.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Источник</TableHead>
                <TableHead>Последняя синхронизация</TableHead>
                <TableHead>Объём</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Автомобили (mashina.kg)</TableCell>
                <TableCell className="tabular-nums">
                  {dash ? fmtDate(dash.overview.last_sync_at) : "—"}
                </TableCell>
                <TableCell className="tabular-nums">
                  {dash ? `${fmtInt(dash.overview.active_count)} активных` : "—"}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Недвижимость (lalafo.kg)</TableCell>
                <TableCell className="tabular-nums">
                  {dq ? fmtDate(dq.lastSync.finishedAt) : "—"}
                </TableCell>
                <TableCell className="tabular-nums">
                  {dq ? `${fmtInt(dq.ads.live)} живых` : "—"}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Курс НБКР</TableCell>
                <TableCell className="tabular-nums">
                  {dq ? fmtDate(dq.fx.latestDay) : "—"}
                </TableCell>
                <TableCell className="tabular-nums">
                  {dq ? `${dq.fx.latestRate.toLocaleString("ru-RU")} сом/$` : "—"}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <p className="mt-4 text-sm text-muted-foreground">
            Проект независимый и некоммерческий, с площадками не аффилирован. Вопросы и идеи —
            в разделы «Автостат» и «Недвижимость», у обоих проектов открытые данные-агрегаты.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
