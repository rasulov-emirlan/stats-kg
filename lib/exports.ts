import "server-only";

import { toCsv, type CsvColumn } from "@/lib/csv";
import { paybackYears, trimRampUp } from "@/lib/derive";
import { getDashboard, getDemand, getSold } from "@/lib/sources/avtostat";
import {
  CATEGORY_APARTMENTS_SALE,
  getMarketIndex,
  getRegionsRent,
  getRegionsSale,
  getYields,
  regionName,
} from "@/lib/sources/lalafo";

export type Csv = { filename: string; content: string };

export async function buildExport(slug: string): Promise<Csv | null> {
  switch (slug) {
    case "cars-trend": {
      const dash = await getDashboard();
      if (!dash) return null;
      const cols: CsvColumn<(typeof dash.trend)[number]>[] = [
        { header: "day", value: (r) => r.day },
        { header: "active_count", value: (r) => r.active_count },
        { header: "new_count", value: (r) => r.new_count },
        { header: "delisted_count", value: (r) => r.delisted_count },
      ];
      return { filename: "cars-trend.csv", content: toCsv(dash.trend, cols) };
    }
    case "market-index": {
      const mi = await getMarketIndex(CATEGORY_APARTMENTS_SALE);
      if (!mi) return null;
      const points = trimRampUp(mi.points);
      return {
        filename: "apartments-market-index.csv",
        content: toCsv(points, [
          { header: "taken_at", value: (r) => r.takenAt },
          { header: "live_count", value: (r) => r.liveCount },
          { header: "p25_kgs", value: (r) => r.p25 },
          { header: "median_kgs", value: (r) => r.median },
          { header: "p75_kgs", value: (r) => r.p75 },
          { header: "usd_kgs_rate", value: (r) => r.usdKgsRate },
        ]),
      };
    }
    case "regions-sale": {
      const data = await getRegionsSale();
      if (!data) return null;
      return {
        filename: "regions-sale.csv",
        content: toCsv(data.regions, [
          { header: "region", value: (r) => regionName(r.region) },
          { header: "listings", value: (r) => r.count },
          { header: "median_usd", value: (r) => r.medianPrice },
          { header: "median_usd_per_sqm", value: (r) => r.medianPricePerSqm },
        ]),
      };
    }
    case "regions-full": {
      const [sale, rent, yields] = await Promise.all([
        getRegionsSale(),
        getRegionsRent(),
        getYields(),
      ]);
      if (!sale) return null;
      const rows = sale.regions.map((s) => {
        const r = rent?.regions.find((x) => x.region === s.region);
        const y = yields?.yields.find((x) => x.region === s.region);
        return {
          region: regionName(s.region),
          sale_listings: s.count,
          sale_median_usd: s.medianPrice,
          sale_median_usd_per_sqm: s.medianPricePerSqm,
          rent_listings: r?.count ?? null,
          rent_median_kgs: r?.medianPrice ?? null,
          gross_yield_pct: y?.grossYieldPct ?? null,
          payback_years: paybackYears(y?.grossYieldPct),
        };
      });
      return {
        filename: "regions-full.csv",
        content: toCsv(rows, [
          { header: "region", value: (r) => r.region },
          { header: "sale_listings", value: (r) => r.sale_listings },
          { header: "sale_median_usd", value: (r) => r.sale_median_usd },
          { header: "sale_median_usd_per_sqm", value: (r) => r.sale_median_usd_per_sqm },
          { header: "rent_listings", value: (r) => r.rent_listings },
          { header: "rent_median_kgs", value: (r) => r.rent_median_kgs },
          { header: "gross_yield_pct", value: (r) => r.gross_yield_pct },
          { header: "payback_years", value: (r) => r.payback_years },
        ]),
      };
    }
    case "fuel-demand": {
      const demand = await getDemand();
      if (!demand) return null;
      return {
        filename: "fuel-attention-index.csv",
        content: toCsv(demand.by_fuel, [
          { header: "fuel", value: (r) => r.name },
          { header: "listings", value: (r) => r.count },
          { header: "median_views_per_day", value: (r) => r.median_views_per_day.toFixed(1) },
          { header: "attention_index", value: (r) => r.index },
        ]),
      };
    }
    case "sold-by-make": {
      const [sold, dash] = await Promise.all([getSold(), getDashboard()]);
      if (!sold) return null;
      return {
        filename: "sold-by-make.csv",
        content: toCsv(sold.by_make, [
          { header: "make", value: (r) => r.make },
          { header: "sold_last_month", value: (r) => r.sold_count },
          { header: "median_days_to_sell", value: (r) => r.median_days },
          { header: "median_price_usd", value: (r) => r.median_price_usd },
          {
            header: "price_drop_pct_per_year",
            value: (r) => dash?.retention.find((x) => x.make === r.make)?.drop_pct_per_year,
          },
        ]),
      };
    }
    default:
      return null;
  }
}

