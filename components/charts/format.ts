import { fmtCompact, fmtInt } from "@/lib/format";

/** Server components pass a key, not a function (functions can't cross the RSC boundary). */
export type FormatKey = "compact" | "compactPrecise" | "int" | "usdInt";

export const FORMATTERS: Record<FormatKey, (v: number) => string> = {
  compact: fmtCompact,
  // for narrow-range series (e.g. 7.21–7.26 млн) where 1-decimal ticks collapse
  compactPrecise: (v) =>
    Math.abs(v) >= 1_000_000
      ? `${(v / 1_000_000).toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} млн`
      : fmtCompact(v),
  int: fmtInt,
  usdInt: (v) => `$${fmtInt(v)}`,
};
