import { generateReportRows, toCsv, REPORT_FIELDS, type ReportField } from "~/lib/report.server";

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const p = url.searchParams;

  const validKeys = new Set<string>(REPORT_FIELDS.map(f => f.key));
  const fields = (p.get("fields") ?? "")
    .split(",")
    .filter((f): f is ReportField => validKeys.has(f));

  try {
    const { headers, rows } = await generateReportRows(
      {
        pdbId:               p.get("pdbId")               ?? undefined,
        author:              p.get("author")              ?? undefined,
        experimentalMethod:  p.get("experimentalMethod")  ?? undefined,
        entityName:          p.get("entityName")          ?? undefined,
        sourceOrganism:      p.get("sourceOrganism")      ?? undefined,
        nonStandardResidue:  p.get("nonStandardResidue")  ?? undefined,
        assignedNtc:         p.get("assignedNtc")         ?? undefined,
        confalScoreMin:      p.get("confalScoreMin")      ?? undefined,
        confalScoreMax:      p.get("confalScoreMax")      ?? undefined,
        polymerType:         p.get("polymerType")         ?? undefined,
        monomerFlag:         p.get("monomerFlag")         ?? undefined,
      },
      fields
    );

    return new Response(toCsv(headers, rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=\"report.csv\"",
      },
    });
  } catch (err) {
    console.error("Report generation failed:", err);
    return Response.json({ error: "Report generation failed" }, { status: 500 });
  }
}