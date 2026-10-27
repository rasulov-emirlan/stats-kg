# STATS.KG

Next.js site over two aggregate APIs (avtostat.kg cars, lalafo-stats real estate).

## Data flow

`fetcher/run.mjs` (compose service `fetcher`, same image) pulls every endpoint in
`fetcher/registry.mjs` hourly with retries, and snapshots it into the `statskg-data`
volume. The web app reads those snapshots (`lib/sources/fetch.ts`) and only falls back
to the live upstream if they are >6h old.

Disk safety: `latest.json` per endpoint is overwritten in place; gzipped history is
written only when content changed (hash dedup), kept hourly 7d / daily 90d / 150 MB cap;
history writes pause when free space < max(3 GB, 5%); logs are JSON lines on stdout under
Docker `max-size 10m × 3`. `GET /api/health` → 503 when any snapshot is >3h old.

Open data: `/dannye`, `/api/v1/datasets`, `/api/export/<slug>[?format=json]`.

## Dev

`pnpm test` · `pnpm lint` · `pnpm build` · deploy: `docker compose up -d --build`
