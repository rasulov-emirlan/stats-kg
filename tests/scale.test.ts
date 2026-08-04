import { describe, expect, it } from "vitest";
import { niceTicks } from "@/lib/scale";

describe("niceTicks", () => {
  it("produces clean steps covering the range", () => {
    const ticks = niceTicks(52350, 53700, 4);
    expect(ticks.length).toBeGreaterThanOrEqual(3);
    for (const t of ticks) expect(t % 250).toBe(0);
    expect(ticks[0]).toBeLessThanOrEqual(52350);
  });
  it("handles a flat series", () => {
    expect(niceTicks(100, 100).length).toBeGreaterThan(0);
  });
  it("handles zero-based ranges", () => {
    const ticks = niceTicks(0, 244, 4);
    expect(ticks[0]).toBe(0);
    expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(200);
  });
});
