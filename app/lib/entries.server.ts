import { pool } from "~/lib/db.server";
import type { RowDataPacket } from "mysql2";

export type Entry = {
  pdbId: string;
  title: string | null;
  method: string | null;
};

type EntryRow = RowDataPacket & Entry;

export async function getEntries(): Promise<Entry[]> {
  const [rows] = await pool.query<EntryRow[]>(`
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
  `);

  return rows;
}