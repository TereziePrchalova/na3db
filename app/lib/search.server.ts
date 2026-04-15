import { pool } from "~/lib/db.server";
import type { RowDataPacket } from "mysql2";

export type SearchResult = {
  pdbId: string;
  title: string | null;
  method: string | null;
};

type SearchRow = RowDataPacket & SearchResult;

export async function searchEntries(params: {
  pdbId?: string;
  author?: string;
}): Promise<SearchResult[]> {
  const conditions: string[] = [];
  const values: string[] = [];

  if (params.pdbId) {
    conditions.push("e.id LIKE ?");
    values.push(`%${params.pdbId}%`);
  }

  if (params.author) {
    conditions.push("ca.name LIKE ?");
    values.push(`%${params.author}%`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const [rows] = await pool.query<SearchRow[]>(
    `
    SELECT DISTINCT
      e.id       AS pdbId,
      s.title,
      ex.method
    FROM entry e
    LEFT JOIN struct          s  ON s.entry_id  = e.id
    LEFT JOIN exptl           ex ON ex.entry_id = e.id
    LEFT JOIN citation        c  ON c.entry_id  = e.id
    LEFT JOIN citation_author ca ON ca.entry_id = e.id AND ca.citation_id = c.id
    ${where}
    ORDER BY e.id ASC
    `,
    values
  );

  return rows;
}
