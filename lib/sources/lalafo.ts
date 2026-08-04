import { getJson } from "./fetch";

const BASE = process.env.LALAFO_API_URL ?? "https://stats.kg";

export const LALAFO_SITE = "https://stats.kg";

/** lalafo parent category ids the market index tracks. */
export const CATEGORY_APARTMENTS_SALE = 2046;
export const CATEGORY_RENT_LONG = 2044;

export type RegionRow = {
  region: string;
  count: number;
  medianPrice: number | null;
  medianPricePerSqm: number | null;
  areaCount: number;
};

export type RegionsResponse = {
  scope: string;
  mode: "sale" | "rent";
  currency: string;
  rate: number;
  regions: RegionRow[];
};

export type YieldRow = {
  region: string;
  medianRentKgs: number;
  medianSaleUsd: number;
  grossYieldPct: number;
  rentCount: number;
  saleCount: number;
};

export type YieldsResponse = {
  scope: string;
  mode: "yield";
  rate: number;
  yields: YieldRow[];
};

export type MarketIndexPoint = {
  takenAt: string;
  liveCount: number;
  median: number;
  p25: number;
  p75: number;
  usdKgsRate: number;
};

export type Fx = {
  latest: number;
  latestDay: string;
  series: { day: string; rate: number }[];
};

export type DataQuality = {
  ads: {
    totalRows: number;
    live: number;
    delisted: number;
    pricedPct: number;
    usdSharePct: number;
    duplicateSharePct: number;
  };
  lastSync: { finishedAt: string; totalFetched: number; newInserted: number; categories: number };
  fx: { days: number; latestDay: string; latestRate: number };
};

export function getRegionsSale() {
  return getJson<RegionsResponse>(BASE, "/api/regions?scope=region&mode=sale", 600);
}

export function getRegionsRent() {
  return getJson<RegionsResponse>(BASE, "/api/regions?scope=region&mode=rent", 600);
}

export function getYields() {
  return getJson<YieldsResponse>(BASE, "/api/regions?scope=region&mode=yield", 600);
}

export function getMarketIndex(category: number) {
  return getJson<{ points: MarketIndexPoint[] }>(
    BASE,
    `/api/market-index?category=${category}`,
    600
  );
}

export function getFx() {
  return getJson<Fx>(BASE, "/api/fx", 3600);
}

export function getDataQuality() {
  return getJson<DataQuality>(BASE, "/api/data-quality", 3600);
}

export const REGION_NAMES: Record<string, string> = {
  bishkek: "Бишкек",
  chuy: "Чуйская обл.",
  "issyk-kul": "Иссык-Куль",
  naryn: "Нарын",
  talas: "Талас",
  "jalal-abad": "Джалал-Абад",
  "osh-region": "Ош и область",
  batken: "Баткен",
};

export function regionName(slug: string): string {
  return REGION_NAMES[slug] ?? slug;
}
