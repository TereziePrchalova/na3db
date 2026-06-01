import { sql } from "~/lib/db.server";

export type SearchResult = {
  pdbId: string;
  title: string | null;
  method: string | null;
};

export async function searchEntries(params: {
  pdbId?: string;
  author?: string;
}): Promise<SearchResult[]> {
  const rows = await sql<SearchResult[]>`
    SELECT DISTINCT
      e.id       AS "pdbId",
      s.title,
      ex.method
    FROM entry e
    LEFT JOIN struct          s  ON s.entry_id  = e.id
    LEFT JOIN exptl           ex ON ex.entry_id = e.id
    LEFT JOIN citation        c  ON c.entry_id  = e.id
    LEFT JOIN citation_author ca ON ca.entry_id = e.id AND ca.citation_id = c.id
    WHERE TRUE
    ${params.pdbId  ? sql`AND e.id    ILIKE ${'%' + params.pdbId  + '%'}` : sql``}
    ${params.author ? sql`AND ca.name ILIKE ${'%' + params.author + '%'}` : sql``}
    ORDER BY e.id ASC
  `;

  return rows;
}
