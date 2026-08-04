const NBSP = " ";

export function fmtInt(n: number): string {
  return new Intl.NumberFormat("ru-RU").format(Math.round(n));
}

export function fmtUsd(n: number): string {
  return `$${fmtInt(n)}`;
}

export function fmtKgs(n: number): string {
  return `${fmtInt(n)}${NBSP}сом`;
}

/** 7 242 930 → "7,2 млн", 89 000 → "89 тыс." */
export function fmtCompact(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) {
    const v = n / 1_000_000;
    return `${v.toLocaleString("ru-RU", { maximumFractionDigits: 1 })}${NBSP}млн`;
  }
  if (abs >= 10_000) {
    return `${Math.round(n / 1000).toLocaleString("ru-RU")}${NBSP}тыс.`;
  }
  return fmtInt(n);
}

export function fmtPct(n: number, digits = 0): string {
  return `${n.toLocaleString("ru-RU", { maximumFractionDigits: digits })}%`;
}

export function fmtX(n: number): string {
  return `${n.toLocaleString("ru-RU", { maximumFractionDigits: 1 })}×`;
}

const MONTHS_SHORT = [
  "янв", "фев", "мар", "апр", "мая", "июн",
  "июл", "авг", "сен", "окт", "ноя", "дек",
];

/** "2026-08-03" → "3 авг" */
export function fmtDayShort(iso: string): string {
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso);
  return `${d.getUTCDate()}${NBSP}${MONTHS_SHORT[d.getUTCMonth()]}`;
}

/** "2026-08-03T05:12:49Z" → "3 авг 2026" */
export function fmtDate(iso: string): string {
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso);
  return `${d.getUTCDate()} ${MONTHS_SHORT[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** Russian plural: plural(5, "машина", "машины", "машин") */
export function plural(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(Math.round(n));
  const d10 = abs % 10;
  const d100 = abs % 100;
  if (d100 >= 11 && d100 <= 14) return many;
  if (d10 === 1) return one;
  if (d10 >= 2 && d10 <= 4) return few;
  return many;
}
