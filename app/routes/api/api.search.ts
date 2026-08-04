import { searchEntries } from "~/lib/search.server";

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const p = url.searchParams;

  try {
    const response = await searchEntries({
      page:                p.get("page")                ?? undefined,
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
    });
    return Response.json(response);
  } catch (err) {
    console.error("Search failed:", err);
    return Response.json({ error: "Search failed" }, { status: 500 });
  }
}
