import { freshness } from "@/fetcher/core.mjs";

export const dynamic = "force-dynamic";

/** 200 when every snapshot is <3h old, 503 otherwise. For uptime checks and the nightly automation. */
export async function GET() {
  const f = await freshness(process.env.DATA_DIR ?? "/data");
  const newest = f.items.map((i) => i.fetchedAt).filter(Boolean).sort().at(-1) ?? null;
  return Response.json(
    { ok: f.ok, lastFetchAt: newest, maxAgeSec: 3 * 3600, endpoints: f.items },
    { status: f.ok ? 200 : 503, headers: { "cache-control": "no-store" } }
  );
}
