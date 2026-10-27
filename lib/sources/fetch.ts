import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";

import { endpointKey } from "@/fetcher/registry.mjs";

const DATA_DIR = process.env.DATA_DIR ?? "/data";
/** Past this the fetcher is presumed down and we go to the upstream ourselves. */
const SNAPSHOT_MAX_AGE_MS = 6 * 3600e3;

async function readSnapshot<T>(base: string, p: string): Promise<T | null> {
  try {
    const dir = path.join(DATA_DIR, "snapshots", endpointKey(base, p));
    const meta = JSON.parse(await fs.readFile(path.join(dir, "latest.meta.json"), "utf8"));
    if (Date.now() - Date.parse(meta.fetchedAt) > SNAPSHOT_MAX_AGE_MS) return null;
    return JSON.parse(await fs.readFile(path.join(dir, "latest.json"), "utf8")) as T;
  } catch {
    return null;
  }
}

/**
 * Reads come from the hourly fetcher's snapshot store; the live upstream is
 * only the fallback (no store, or the fetcher has been silent for hours).
 * All reads degrade to null: a dead upstream renders the page with
 * "нет данных" blocks instead of a 500.
 */
export async function getJson<T>(
  base: string,
  path: string,
  revalidate: number
): Promise<T | null> {
  const snap = await readSnapshot<T>(base, path);
  if (snap) return snap;
  try {
    const res = await fetch(`${base}${path}`, {
      next: { revalidate },
      signal: AbortSignal.timeout(8000),
      headers: { accept: "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
