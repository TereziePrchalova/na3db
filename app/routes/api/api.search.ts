import { searchEntries } from "~/lib/search.server";

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const pdbId = url.searchParams.get("pdbId") ?? undefined;
  const author = url.searchParams.get("author") ?? undefined;

  try {
    const results = await searchEntries({ pdbId, author });
    return Response.json(results);
  } catch (err) {
    console.error("Search failed:", err);
    return Response.json({ error: "Search failed" }, { status: 500 });
  }
}
