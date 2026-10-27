export type Audience = "public" | "press" | "business" | "dev";

export type Dataset = {
  slug: string;
  title: string;
  about: string;
  audiences: Audience[];
  columns: string;
};

/** Catalog behind /dannye and /api/v1/datasets; slugs match lib/exports.ts. */
export const DATASETS: Dataset[] = [
  {
    slug: "cars-trend",
    title: "Автомобильный рынок по дням",
    about: "Активные, новые и снятые объявления mashina.kg за день.",
    audiences: ["press", "dev"],
    columns: "day, active_count, new_count, delisted_count",
  },
  {
    slug: "sold-by-make",
    title: "Продажи и скорость по маркам",
    about: "Сколько машин ушло за месяц, за сколько дней и как дешевеют за год.",
    audiences: ["public", "business"],
    columns: "make, sold_last_month, median_days_to_sell, median_price_usd, price_drop_pct_per_year",
  },
  {
    slug: "fuel-demand",
    title: "Внимание к типам топлива",
    about: "Просмотры в день и индекс внимания относительно рынка.",
    audiences: ["business", "press"],
    columns: "fuel, listings, median_views_per_day, attention_index",
  },
  {
    slug: "market-index",
    title: "Индекс цен на квартиры",
    about: "Медиана и квартили цены продажи в сомах, с курсом.",
    audiences: ["press", "dev"],
    columns: "taken_at, live_count, p25_kgs, median_kgs, p75_kgs, usd_kgs_rate",
  },
  {
    slug: "regions-sale",
    title: "Цены на квартиры по регионам",
    about: "Объявления, медиана цены и цены за м² в долларах.",
    audiences: ["public", "press"],
    columns: "region, listings, median_usd, median_usd_per_sqm",
  },
  {
    slug: "regions-full",
    title: "Регионы: продажа, аренда, окупаемость",
    about: "Одна таблица для сравнения регионов: цены, аренда, доходность.",
    audiences: ["business", "press", "dev"],
    columns:
      "region, sale_listings, sale_median_usd, sale_median_usd_per_sqm, rent_listings, rent_median_kgs, gross_yield_pct, payback_years",
  },
];

export const AUDIENCES: Record<Audience, string> = {
  public: "Обычному читателю",
  press: "Журналистам и исследователям",
  business: "Бизнесу",
  dev: "Разработчикам",
};
