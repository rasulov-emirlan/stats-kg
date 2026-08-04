import { describe, expect, it } from "vitest";
import {
  attentionMultiplier,
  carsPerApartment,
  importSharePct,
  paybackYears,
  trimRampUp,
} from "@/lib/derive";

describe("carsPerApartment", () => {
  it("rounds to one decimal", () => {
    expect(carsPerApartment(89000, 12500)).toBe(7.1);
  });
  it("nulls on missing or zero inputs", () => {
    expect(carsPerApartment(null, 12500)).toBeNull();
    expect(carsPerApartment(89000, 0)).toBeNull();
    expect(carsPerApartment(undefined, undefined)).toBeNull();
  });
});

describe("paybackYears", () => {
  it("inverts gross yield", () => {
    expect(paybackYears(7.7)).toBe(13);
    expect(paybackYears(16.9)).toBe(6);
  });
  it("nulls on zero/negative yield", () => {
    expect(paybackYears(0)).toBeNull();
    expect(paybackYears(-2)).toBeNull();
    expect(paybackYears(null)).toBeNull();
  });
});

describe("importSharePct", () => {
  it("computes the pre-customs share", () => {
    expect(importSharePct(53689, 35477)).toBe(34);
  });
  it("nulls on inconsistent totals", () => {
    expect(importSharePct(100, 200)).toBeNull();
    expect(importSharePct(0, 0)).toBeNull();
    expect(importSharePct(null, 5)).toBeNull();
  });
});

describe("attentionMultiplier", () => {
  it("turns index into ×", () => {
    expect(attentionMultiplier(244)).toBe(2.4);
    expect(attentionMultiplier(91)).toBe(0.9);
  });
  it("nulls on missing index", () => {
    expect(attentionMultiplier(undefined)).toBeNull();
    expect(attentionMultiplier(0)).toBeNull();
  });
});

describe("trimRampUp", () => {
  const pts = [
    { liveCount: 13404, median: 1 },
    { liveCount: 22628, median: 2 },
    { liveCount: 30428, median: 3 },
  ];
  it("drops coverage-ramp points below 60% of best", () => {
    expect(trimRampUp(pts).map((p) => p.liveCount)).toEqual([22628, 30428]);
  });
  it("keeps everything when coverage is stable", () => {
    const stable = [{ liveCount: 100 }, { liveCount: 98 }, { liveCount: 102 }];
    expect(trimRampUp(stable)).toHaveLength(3);
  });
  it("handles empty input", () => {
    expect(trimRampUp([])).toEqual([]);
  });
});
