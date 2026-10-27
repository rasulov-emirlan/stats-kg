export type CsvColumn<T> = {
  header: string;
  value: (row: T) => string | number | null | undefined;
};

function escapeCell(v: string | number | null | undefined): string {
  if (v == null) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const head = columns.map((c) => escapeCell(c.header)).join(",");
  const body = rows.map((r) => columns.map((c) => escapeCell(c.value(r))).join(","));
  return [head, ...body].join("\r\n") + "\r\n";
}

function parseLine(src: string, i: number): [string[], number] {
  const cells: string[] = [];
  let cur = "";
  let quoted = false;
  for (; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') quoted = false;
      else cur += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { cells.push(cur); cur = ""; }
    else if (c === "\r" || c === "\n") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      cells.push(cur);
      return [cells, i + 1];
    } else cur += c;
  }
  cells.push(cur);
  return [cells, i];
}

/** Inverse of toCsv: records keyed by header; numeric cells become numbers, empty cells null. */
export function csvToRecords(csv: string): Record<string, string | number | null>[] {
  const out: Record<string, string | number | null>[] = [];
  const [head, first] = parseLine(csv, 0);
  let i = first;
  while (i < csv.length) {
    let cells: string[];
    [cells, i] = parseLine(csv, i);
    if (cells.length === 1 && cells[0] === "") continue;
    out.push(
      Object.fromEntries(
        head.map((h, k) => {
          const v = cells[k] ?? "";
          return [h, v === "" ? null : /^-?\d+(\.\d+)?$/.test(v) ? Number(v) : v];
        })
      )
    );
  }
  return out;
}
