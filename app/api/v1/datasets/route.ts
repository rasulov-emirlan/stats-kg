import { DATASETS } from "@/lib/datasets";

export const dynamic = "force-dynamic";

export function GET(req: Request) {
  const origin = new URL(req.url).origin;
  return Response.json(
    {
      license: "CC BY 4.0",
      attribution: "STATS.KG (statskg.night.enkiduck.com), по открытым объявлениям mashina.kg и lalafo.kg",
      updated: "hourly",
      datasets: DATASETS.map((d) => ({
        ...d,
        csv: `${origin}/api/export/${d.slug}`,
        json: `${origin}/api/export/${d.slug}?format=json`,
      })),
    },
    { headers: { "access-control-allow-origin": "*", "cache-control": "public, max-age=3600" } }
  );
}
