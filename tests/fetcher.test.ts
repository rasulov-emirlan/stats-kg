import { mkdtemp, readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { describe, expect, it } from "vitest";

import {
  diskGuard, fetchWithRetry, freshness, pruneHistory, runOnce, storeSnapshot,
} from "@/fetcher/core.mjs";
import { ENDPOINTS, endpointKey, SOURCES } from "@/fetcher/registry.mjs";

const tmp = () => mkdtemp(path.join(os.tmpdir(), "statskg-"));
const res = (status: number, body: unknown = {}) =>
  ({ ok: status < 400, status, json: async () => body }) as Response;

describe("fetchWithRetry", () => {
  it("retries 5xx then succeeds", async () => {
    let n = 0;
    const fetch = async () => (++n < 3 ? res(503) : res(200, { a: 1 }));
    expect(await fetchWithRetry("u", { fetch, retryWaitMs: 1 })).toEqual({ a: 1 });
    expect(n).toBe(3);
  });
  it("does not retry 4xx", async () => {
    let n = 0;
    const fetch = async () => (++n, res(404));
    await expect(fetchWithRetry("u", { fetch, retryWaitMs: 1 })).rejects.toThrow("HTTP 404");
    expect(n).toBe(1);
  });
  it("gives up after the retry budget", async () => {
    let n = 0;
    const fetch = async () => { n++; throw new Error("boom"); };
    await expect(fetchWithRetry("u", { fetch, retries: 3, retryWaitMs: 1 })).rejects.toThrow("boom");
    expect(n).toBe(3);
  });
});

describe("storeSnapshot dedup", () => {
  it("writes history only when content changed", async () => {
    const dir = await tmp();
    const t = new Date("2026-10-27T10:00:00Z");
    const a = await storeSnapshot(dir, "k", { v: 1 }, t);
    const b = await storeSnapshot(dir, "k", { v: 1 }, new Date("2026-10-27T11:00:00Z"));
    const c = await storeSnapshot(dir, "k", { v: 2 }, new Date("2026-10-27T12:00:00Z"));
    expect([a.wroteHistory, b.wroteHistory, c.wroteHistory]).toEqual([true, false, true]);
    expect(await readdir(path.join(dir, "snapshots/k/history"))).toHaveLength(2);
    expect(JSON.parse(await readFile(path.join(dir, "snapshots/k/latest.json"), "utf8"))).toEqual({ v: 2 });
  });
  it("keeps latest but skips history when the disk guard trips", async () => {
    const dir = await tmp();
    const r = await storeSnapshot(dir, "k", { v: 1 }, new Date(), { ok: false });
    expect(r.wroteHistory).toBe(false);
    expect(await readdir(path.join(dir, "snapshots/k/history"))).toHaveLength(0);
    expect(JSON.parse(await readFile(path.join(dir, "snapshots/k/latest.json"), "utf8"))).toEqual({ v: 1 });
  });
  it("history files are gzip of the payload", async () => {
    const dir = await tmp();
    await storeSnapshot(dir, "k", { v: 9 }, new Date("2026-10-27T10:00:00Z"));
    const gz = await readFile(path.join(dir, "snapshots/k/history/20261027T10.json.gz"));
    expect(JSON.parse(zlib.gunzipSync(gz).toString())).toEqual({ v: 9 });
  });
});

describe("pruneHistory", () => {
  const now = new Date("2026-10-27T12:00:00Z");
  const seed = async (names: string[], size = 10) => {
    const dir = await tmp();
    const h = path.join(dir, "snapshots/k/history");
    await mkdir(h, { recursive: true });
    for (const n of names) await writeFile(path.join(h, n), "x".repeat(size));
    return { dir, h };
  };
  it("keeps hourly for a week, one per day after, drops past 90 days", async () => {
    const { dir, h } = await seed([
      "20260101T05.json.gz", // >90d: gone
      "20261010T03.json.gz", // 17d old, first of its day: kept
      "20261010T09.json.gz", // same day: dropped
      "20261026T09.json.gz", // <7d: kept
      "20261026T10.json.gz", // <7d: kept
      "junk.txt",
    ]);
    await pruneHistory(dir, now);
    expect((await readdir(h)).sort()).toEqual([
      "20261010T03.json.gz", "20261026T09.json.gz", "20261026T10.json.gz",
    ]);
  });
  it("enforces the byte cap oldest-first", async () => {
    const { dir, h } = await seed(["20261026T01.json.gz", "20261026T02.json.gz", "20261026T03.json.gz"], 100);
    const r = await pruneHistory(dir, now, { maxHistoryBytes: 200 });
    expect(await readdir(h)).toEqual(["20261026T02.json.gz", "20261026T03.json.gz"]);
    expect(r.historyBytes).toBe(200);
  });
});

describe("diskGuard", () => {
  it("trips when the floor exceeds free space", async () => {
    const dir = await tmp();
    expect((await diskGuard(dir, { minFreeBytes: 1e18 })).ok).toBe(false);
    expect((await diskGuard(dir, { minFreeBytes: 1, minFreeFrac: 0 })).ok).toBe(true);
  });
});

describe("runOnce + freshness", () => {
  it("isolates a failing endpoint, writes status, reports freshness", async () => {
    const dir = await tmp();
    const eps = ENDPOINTS.slice(0, 3);
    const s = await runOnce(dir, {
      endpoints: eps,
      retries: 1,
      urlFor: (ep: { path: string }) => ep.path,
      fetch: async (u: string) => (u === eps[1].path ? res(500) : res(200, { u })),
    });
    expect([s.ok, s.failed]).toEqual([2, 1]);
    expect(JSON.parse(await readFile(path.join(dir, "status.json"), "utf8")).failed).toBe(1);
    expect(await readFile(path.join(dir, "last-success"), "utf8")).toBeTruthy();
    const f = await freshness(dir);
    expect(f.ok).toBe(false); // other registry endpoints never fetched
    const stale = await freshness(dir, new Date(Date.now() + 4 * 3600e3));
    expect(stale.items.every((i: { stale: boolean }) => i.stale)).toBe(true);
  });
  it("registry keys are unique and filesystem safe", () => {
    const keys = ENDPOINTS.map((e) => endpointKey((SOURCES as Record<string, string>)[e.source], e.path));
    expect(new Set(keys).size).toBe(keys.length);
    keys.forEach((k) => expect(k).toMatch(/^[a-zA-Z0-9_]+$/));
  });
});
