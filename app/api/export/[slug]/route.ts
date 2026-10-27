import { csvToRecords } from "@/lib/csv";
import { buildExport } from "@/lib/exports";

export const revalidate = 600;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const out = await buildExport(slug);
  if (!out) {
    return new Response("unknown export or source unavailable", { status: 404 });
  }
  const format = new URL(req.url).searchParams.get("format");
  const cache = "public, max-age=600";
  if (format === "json") {
    return Response.json(
      { dataset: slug, license: "CC BY 4.0", rows: csvToRecords(out.content) },
      { headers: { "cache-control": cache, "access-control-allow-origin": "*" } }
    );
  }
  return new Response(out.content, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${out.filename}"`,
      "cache-control": cache,
      "access-control-allow-origin": "*",
    },
  });
}
