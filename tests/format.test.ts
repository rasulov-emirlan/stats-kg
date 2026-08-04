import { describe, expect, it } from "vitest";
import {
  fmtCompact,
  fmtDayShort,
  fmtInt,
  fmtPct,
  fmtUsd,
  fmtX,
  plural,
} from "@/lib/format";

// Intl.NumberFormat("ru-RU") separates thousands with U+00A0
const strip = (s: string) => s.replace(/[   ]/g, " ");

describe("number formats", () => {
  it("groups thousands", () => {
    expect(strip(fmtInt(53689))).toBe("53 689");
    expect(strip(fmtUsd(12500))).toBe("$12 500");
  });
  it("compacts millions and tens of thousands", () => {
    expect(strip(fmtCompact(7242930))).toBe("7,2 млн");
    expect(strip(fmtCompact(89000))).toBe("89 тыс.");
    expect(strip(fmtCompact(9500))).toBe("9 500");
  });
  it("formats percent and multiplier", () => {
    expect(fmtPct(34)).toBe("34%");
    expect(fmtPct(7.7, 1)).toBe("7,7%");
    expect(fmtX(2.4)).toBe("2,4×");
  });
});

describe("dates", () => {
  it("renders short day from date and timestamp", () => {
    expect(strip(fmtDayShort("2026-08-03"))).toBe("3 авг");
    expect(strip(fmtDayShort("2026-07-25T18:23:13.069Z"))).toBe("25 июл");
  });
});

describe("plural", () => {
  const p = (n: number) => plural(n, "день", "дня", "дней");
  it("follows Russian plural rules", () => {
    expect(p(1)).toBe("день");
    expect(p(3)).toBe("дня");
    expect(p(8)).toBe("дней");
    expect(p(11)).toBe("дней");
    expect(p(21)).toBe("день");
    expect(p(104)).toBe("дня");
  });
});
