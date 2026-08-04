/** Clean axis ticks: round step of 1/2/2.5/5 × 10^k covering [min, max]. */
export function niceTicks(min: number, max: number, target = 4): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [];
  if (min === max) {
    if (min === 0) return [0, 1];
    min = min * 0.95;
    max = max * 1.05;
  }
  const span = max - min;
  const rawStep = span / Math.max(1, target);
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const norm = rawStep / mag;
  let step: number;
  if (norm <= 1) step = 1;
  else if (norm <= 2) step = 2;
  else if (norm <= 2.5) step = 2.5;
  else if (norm <= 5) step = 5;
  else step = 10;
  step *= mag;
  const start = Math.floor(min / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max + step * 1e-9; v += step) {
    // fight float drift so 0.30000000000000004 renders as 0.3
    ticks.push(Math.round(v / step) * step);
  }
  return ticks;
}
