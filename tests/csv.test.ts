import { describe, expect, it } from "vitest";
import { toCsv } from "@/lib/csv";

describe("toCsv", () => {
  const rows = [
    { name: "Бишкек", value: 1622 },
    { name: 'with "quote", comma', value: null as number | null },
  ];
  const cols = [
    { header: "region", value: (r: (typeof rows)[number]) => r.name },
    { header: "usd_per_sqm", value: (r: (typeof rows)[number]) => r.value },
  ];

  it("writes header + rows with CRLF", () => {
    const csv = toCsv(rows, cols);
    const lines = csv.split("\r\n");
    expect(lines[0]).toBe("region,usd_per_sqm");
    expect(lines[1]).toBe("Бишкек,1622");
  });

  it("escapes quotes and commas, empties nulls", () => {
    const csv = toCsv(rows, cols);
    expect(csv).toContain('"with ""quote"", comma",');
  });
});

import { csvToRecords } from "@/lib/csv";
describe("csvToRecords", () => {
  it("round-trips toCsv incl. quotes, nulls, numbers", () => {
    const rows = [{ a: 'x,"y"', b: 1.5 }, { a: "z", b: null as number | null }];
    const csv = toCsv(rows, [
      { header: "a", value: (r) => r.a },
      { header: "b", value: (r) => r.b },
    ]);
    expect(csvToRecords(csv)).toEqual([{ a: 'x,"y"', b: 1.5 }, { a: "z", b: null }]);
  });
});
