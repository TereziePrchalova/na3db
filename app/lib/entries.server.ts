import { sql } from "~/lib/db.server";

export type Entry = {
  pdbId: string;
  title: string | null;
  method: string | null;
};

export async function getEntries(): Promise<Entry[]> {
  const rows = await sql<Entry[]>`
    SELECT
      e.id AS pdbId,
      s.title,
      ex.method
    FROM entry e
    LEFT JOIN struct s
      ON s.entry_id = e.id
    LEFT JOIN exptl ex
      ON ex.entry_id = e.id
    ORDER BY e.id ASC
  `;

  return rows;
}