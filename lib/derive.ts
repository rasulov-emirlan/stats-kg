/**
 * Cross-market derivations. All inputs are medians/aggregates from the two
 * source systems; every function is pure and returns null when the inputs
 * can't support the claim (missing data, division by ~zero).
 */

/** How many median local cars one apartment costs. */
export function carsPerApartment(
  apartmentUsd: number | null | undefined,
  carUsd: number | null | undefined
): number | null {
  if (!apartmentUsd || !carUsd || carUsd <= 0) return null;
  return Math.round((apartmentUsd / carUsd) * 10) / 10;
}

/** Gross-yield % → full payback horizon in years. */
export function paybackYears(grossYieldPct: number | null | undefined): number | null {
  if (!grossYieldPct || grossYieldPct <= 0) return null;
  return Math.round(100 / grossYieldPct);
}

/** Share of pre-customs import listings among all active car listings. */
export function importSharePct(
  totalAll: number | null | undefined,
  totalLocal: number | null | undefined
): number | null {
  if (!totalAll || totalLocal == null || totalAll <= 0 || totalLocal > totalAll) return null;
  return Math.round(((totalAll - totalLocal) / totalAll) * 100);
}

/** Attention index (base 100) → "N× чаще обычного" multiplier. */
export function attentionMultiplier(index: number | null | undefined): number | null {
  if (!index || index <= 0) return null;
  return Math.round(index / 10) / 10;
}

/**
 * The real-estate market index's live_count ramps up over the first sync runs
 * (coverage artifact, not market growth). A median from a run that saw under
 * `minCoverage` of the best-known count is unreliable — drop those points.
 */
export function trimRampUp<T extends { liveCount: number }>(
  points: T[],
  minCoverage = 0.6
): T[] {
  if (points.length === 0) return points;
  const best = Math.max(...points.map((p) => p.liveCount));
  return points.filter((p) => p.liveCount >= best * minCoverage);
}
