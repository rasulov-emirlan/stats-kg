import "server-only";

/**
 * All source reads degrade to null: a dead upstream renders the page with
 * "нет данных" blocks instead of a 500. Every endpoint we touch is an
 * aggregate the upstreams cache in-memory, so revalidate can be generous.
 */
export async function getJson<T>(
  base: string,
  path: string,
  revalidate: number
): Promise<T | null> {
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
