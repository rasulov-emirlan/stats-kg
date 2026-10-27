// Always-on hourly fetcher. Logs one JSON line per event to stdout; Docker's
// json-file driver (max-size/max-file in compose) is the only log sink, so
// logs are bounded by construction.
import { promises as fs } from "node:fs";

import { runOnce, freshness } from "./core.mjs";

const DATA = process.env.DATA_DIR ?? "/data";
const EVERY = Number(process.env.FETCH_INTERVAL_MS ?? 3600e3);

const log = (level, msg, extra = {}) =>
  console.log(JSON.stringify({ t: new Date().toISOString(), level, msg, ...extra }));

async function tick() {
  const started = Date.now();
  try {
    const s = await runOnce(DATA, { log });
    const fr = await freshness(DATA);
    log(s.failed ? "warn" : "info", "pass done", {
      ok: s.ok, failed: s.failed, ms: Date.now() - started,
      freeGB: +(s.disk.free / 1e9).toFixed(1), dataMB: +(s.dataBytes / 1e6).toFixed(2),
      fresh: fr.ok,
    });
  } catch (e) {
    log("error", "pass crashed", { err: String(e) });
  }
}

await fs.mkdir(DATA, { recursive: true });
log("info", "fetcher start", { every_ms: EVERY, data: DATA });
// Align passes to the interval so a restart doesn't skew the schedule, but
// always run one immediately: a fresh container should never serve stale data.
await tick();
setInterval(tick, EVERY);
