import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

import { ENDPOINTS, endpointKey, endpointUrl, SOURCES } from "./registry.mjs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const DEFAULTS = {
  retries: 4,
  retryWaitMs: 5000,
  timeoutMs: 15000,
  hourlyKeepMs: 7 * 24 * 3600e3,
  dailyKeepMs: 90 * 24 * 3600e3,
  maxHistoryBytes: 150 * 1024 * 1024,
  minFreeBytes: 3 * 1024 ** 3,
  minFreeFrac: 0.05,
};

/** GET with growing backoff on 5xx/429/network errors; 4xx fails at once. */
export async function fetchWithRetry(url, opts = {}) {
  const o = { ...DEFAULTS, ...opts };
  const f = o.fetch ?? fetch;
  let last;
  for (let try_ = 1; try_ <= o.retries; try_++) {
    try {
      const res = await f(url, {
        headers: { accept: "application/json", "user-agent": "statskg-fetcher/1" },
        signal: AbortSignal.timeout(o.timeoutMs),
      });
      if (res.ok) return await res.json();
      last = new Error(`HTTP ${res.status}`);
      if (res.status < 500 && res.status !== 429) throw Object.assign(last, { fatal: true });
    } catch (e) {
      if (e.fatal) throw e;
      last = e;
    }
    if (try_ < o.retries) {
      o.log?.("warn", "fetch failed, retrying", { url, try: try_, err: String(last) });
      await sleep(try_ * o.retryWaitMs);
    }
  }
  throw last;
}

/** Free space check on the data volume; history writes stop below the floor. */
export async function diskGuard(dir, opts = {}) {
  const o = { ...DEFAULTS, ...opts };
  const st = await fs.statfs(dir);
  const free = st.bavail * st.bsize;
  const total = st.blocks * st.bsize;
  const floor = Math.max(o.minFreeBytes, total * o.minFreeFrac);
  return { free, total, floor, ok: free >= floor };
}

async function atomicWrite(file, data) {
  const tmp = `${file}.${process.pid}.tmp`;
  await fs.writeFile(tmp, data);
  await fs.rename(tmp, file);
}

const stamp = (d) => d.toISOString().replace(/[-:]/g, "").slice(0, 11); // YYYYMMDDTHH

/**
 * Stores one payload: latest.json always (it is what the site reads), plus a
 * gzipped hourly snapshot in history/ only when the content changed and the
 * disk guard allows it. Returns what happened for logging.
 */
export async function storeSnapshot(dataDir, key, payload, now = new Date(), guard = { ok: true }) {
  const dir = path.join(dataDir, "snapshots", key);
  await fs.mkdir(path.join(dir, "history"), { recursive: true });
  const body = JSON.stringify(payload);
  const hash = createHash("sha256").update(body).digest("hex");
  let prev = null;
  try {
    prev = JSON.parse(await fs.readFile(path.join(dir, "latest.meta.json"), "utf8"));
  } catch {}
  const changed = prev?.hash !== hash;
  await atomicWrite(path.join(dir, "latest.json"), body);
  const meta = { hash, fetchedAt: now.toISOString(), bytes: body.length, changedAt: changed ? now.toISOString() : prev.changedAt };
  await atomicWrite(path.join(dir, "latest.meta.json"), JSON.stringify(meta));
  let wroteHistory = false;
  if (changed && guard.ok) {
    await atomicWrite(path.join(dir, "history", `${stamp(now)}.json.gz`), zlib.gzipSync(body));
    wroteHistory = true;
  }
  return { changed, wroteHistory, bytes: body.length };
}

/** Hourly for hourlyKeepMs, then one per day until dailyKeepMs, then gone; then a global byte cap, oldest first. */
export async function pruneHistory(dataDir, now = new Date(), opts = {}) {
  const o = { ...DEFAULTS, ...opts };
  const root = path.join(dataDir, "snapshots");
  let removed = 0;
  const survivors = [];
  for (const key of await fs.readdir(root).catch(() => [])) {
    const hdir = path.join(root, key, "history");
    const seenDays = new Set();
    for (const name of (await fs.readdir(hdir).catch(() => [])).sort()) {
      const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})\.json\.gz$/.exec(name);
      const file = path.join(hdir, name);
      if (!m) { await fs.rm(file, { force: true }); removed++; continue; }
      const age = now - Date.parse(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:00:00Z`);
      const day = `${m[1]}${m[2]}${m[3]}`;
      let drop = age > o.dailyKeepMs;
      if (!drop && age > o.hourlyKeepMs) { drop = seenDays.has(day); seenDays.add(day); }
      if (drop) { await fs.rm(file, { force: true }); removed++; continue; }
      const st = await fs.stat(file);
      survivors.push({ file, size: st.size, name });
    }
  }
  let total = survivors.reduce((a, s) => a + s.size, 0);
  survivors.sort((a, b) => a.name.localeCompare(b.name));
  for (const s of survivors) {
    if (total <= o.maxHistoryBytes) break;
    await fs.rm(s.file, { force: true });
    total -= s.size;
    removed++;
  }
  return { removed, historyBytes: total };
}

export async function dirBytes(dir) {
  let n = 0;
  for (const e of await fs.readdir(dir, { withFileTypes: true }).catch(() => [])) {
    const p = path.join(dir, e.name);
    n += e.isDirectory() ? await dirBytes(p) : (await fs.stat(p)).size;
  }
  return n;
}

/** One full pass over every endpoint. A failing endpoint never stops the others. */
export async function runOnce(dataDir, opts = {}) {
  const log = opts.log ?? (() => {});
  const now = opts.now ?? new Date();
  const guard = await diskGuard(dataDir, opts);
  if (!guard.ok) log("error", "disk guard: free space below floor, history writes paused", guard);
  const results = [];
  for (const ep of opts.endpoints ?? ENDPOINTS) {
    const key = endpointKey(SOURCES[ep.source], ep.path);
    const url = (opts.urlFor ?? endpointUrl)(ep);
    try {
      const payload = await fetchWithRetry(url, { ...opts, log });
      const r = await storeSnapshot(dataDir, key, payload, now, guard);
      results.push({ key, ok: true, ...r });
      log("info", "fetched", { key, changed: r.changed, bytes: r.bytes });
    } catch (e) {
      results.push({ key, ok: false, error: String(e) });
      log("error", "fetch gave up", { key, err: String(e) });
    }
  }
  const pruned = await pruneHistory(dataDir, now, opts);
  const status = {
    at: now.toISOString(),
    ok: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
    disk: guard,
    history: pruned,
    dataBytes: await dirBytes(dataDir),
  };
  await atomicWrite(path.join(dataDir, "status.json"), JSON.stringify(status));
  if (status.ok > 0) await atomicWrite(path.join(dataDir, "last-success"), now.toISOString());
  return status;
}

/** Per-endpoint age from latest.meta.json; stale = older than maxAgeMs. */
export async function freshness(dataDir, now = new Date(), maxAgeMs = 3 * 3600e3) {
  const items = [];
  for (const ep of ENDPOINTS) {
    const key = endpointKey(SOURCES[ep.source], ep.path);
    try {
      const m = JSON.parse(await fs.readFile(path.join(dataDir, "snapshots", key, "latest.meta.json"), "utf8"));
      const age = now - Date.parse(m.fetchedAt);
      items.push({ key, fetchedAt: m.fetchedAt, changedAt: m.changedAt, ageSec: Math.round(age / 1000), stale: age > maxAgeMs });
    } catch {
      items.push({ key, fetchedAt: null, changedAt: null, ageSec: null, stale: true });
    }
  }
  return { ok: items.every((i) => !i.stale), items };
}
