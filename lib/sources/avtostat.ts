import { getJson } from "./fetch";

const BASE = process.env.AVTOSTAT_API_URL ?? "https://avtostat.kg";

export const AVTOSTAT_SITE = "https://avtostat.kg";

/**
 * Overview medians are local-only (под-заказ imports excluded) — see
 * mashina-cli stats.Overview. The trend series' median, by contrast, is over
 * ALL active listings including imports; we chart its counts, not its median.
 */
export type CarsOverview = {
  active_count: number;
  imported_count: number;
  median_price_usd: number;
  median_year: number;
  median_mileage_km: number;
  added_week: number;
  last_sync_at: string;
};

export type TrendPoint = {
  day: string;
  active_count: number;
  new_count: number;
  delisted_count: number;
  median_price_usd: number;
};

export type Dashboard = {
  overview: CarsOverview;
  trend: TrendPoint[];
  retention: { make: string; drop_pct_per_year: number; years: number }[];
  liquidity: { make: string; model: string; sold_count: number; median_days: number }[];
};

export type DemandGroup = {
  name: string;
  count: number;
  median_views_per_day: number;
  index: number;
};

export type DemandModel = {
  make: string;
  model: string;
  count: number;
  median_views_per_day: number;
  index: number;
  median_price_usd: number;
};

export type Demand = {
  window_days: number;
  rated_count: number;
  market_median: number;
  computed_at: string;
  most_wanted: DemandModel[];
  ignored: DemandModel[];
  by_price: DemandGroup[];
  by_body: DemandGroup[];
  by_fuel: DemandGroup[];
};

export type Sold = {
  week_count: number;
  month_count: number;
  median_days: number;
  cut_share_pct: number;
  median_cut_pct: number;
  by_make: { make: string; sold_count: number; median_days: number; median_price_usd: number }[];
};

export function getDashboard() {
  return getJson<Dashboard>(BASE, "/api/dashboard", 600);
}

export function getDemand() {
  return getJson<Demand>(BASE, "/api/demand", 600);
}

export function getSold() {
  return getJson<Sold>(BASE, "/api/sold", 600);
}

/**
 * Import share needs totals with and without origin=local; /api/listings is
 * the only endpoint that exposes a filtered total. per_page=1 keeps it cheap.
 */
export async function getListingTotals(): Promise<{ all: number; local: number } | null> {
  const [all, local] = await Promise.all([
    getJson<{ total: number }>(BASE, "/api/listings?per_page=1", 3600),
    getJson<{ total: number }>(BASE, "/api/listings?per_page=1&origin=local", 3600),
  ]);
  if (!all || !local) return null;
  return { all: all.total, local: local.total };
}
