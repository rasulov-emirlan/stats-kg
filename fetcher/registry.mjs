// Single source of truth for what the fetcher pulls hourly and what the web
// app reads back. Keys are `source + path`, so lib/sources/fetch.ts can look a
// request up without a second mapping.
export const SOURCES = {
  avtostat: process.env.AVTOSTAT_API_URL ?? "https://avtostat.kg",
  lalafo: process.env.LALAFO_API_URL ?? "https://stats.kg",
};

export const ENDPOINTS = [
  { source: "avtostat", path: "/api/dashboard" },
  { source: "avtostat", path: "/api/demand" },
  { source: "avtostat", path: "/api/sold" },
  { source: "avtostat", path: "/api/listings?per_page=1" },
  { source: "avtostat", path: "/api/listings?per_page=1&origin=local" },
  { source: "lalafo", path: "/api/regions?scope=region&mode=sale" },
  { source: "lalafo", path: "/api/regions?scope=region&mode=rent" },
  { source: "lalafo", path: "/api/regions?scope=region&mode=yield" },
  { source: "lalafo", path: "/api/market-index?category=2046" },
  { source: "lalafo", path: "/api/fx" },
  { source: "lalafo", path: "/api/data-quality" },
];

export function endpointKey(base, path) {
  const name = Object.entries(SOURCES).find(([, b]) => b === base)?.[0] ?? "ext";
  return `${name}${path}`.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_|_$/g, "");
}

export function endpointUrl(ep) {
  return `${SOURCES[ep.source]}${ep.path}`;
}
