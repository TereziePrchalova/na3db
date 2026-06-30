import { sql } from "~/lib/db.server";
import { buildSearchWhere, type SearchFilterParams } from "~/lib/search.server";

export const REPORT_FIELDS = [
  { key: "pdbId", label: "PDB ID" },
  { key: "author", label: "Author" },
  { key: "experimentalMethod", label: "Experimental Method" },
  { key: "confalScore", label: "Overall Confal Score" },
  { key: "helixLength", label: "Helix Length" },
  { key: "assignedNtc", label: "Assigned NtC" },
  { key: "entityName", label: "Entity Name" },
  { key: "sourceOrganism", label: "Source Organism" },
  { key: "polymerType", label: "Polymer Type" },
  { key: "monomerFlag", label: "Monomer Standard Flag" },
] as const;

export type ReportField = typeof REPORT_FIELDS[number]["key"];

async function fetchFieldValues(field: ReportField, entryIds: string[]): Promise<Map<string, string>> {
  const ids = sql.array(entryIds);
  let rows: { pdbId: string; value: string | null }[];

  switch (field) {
    case "author":
      rows = await sql`
        SELECT entry_id AS "pdbId", string_agg(DISTINCT name, ', ') AS value
        FROM citation_author
        WHERE citation_id = 'primary' AND entry_id = ANY(${ids}::text[])
        GROUP BY entry_id
      `;
      break;
    case "experimentalMethod":
      rows = await sql`
        SELECT entry_id AS "pdbId", string_agg(DISTINCT method, ', ') AS value
        FROM exptl
        WHERE entry_id = ANY(${ids}::text[])
        GROUP BY entry_id
      `;
      break;
    case "confalScore":
      rows = await sql`
        SELECT entry_id AS "pdbId", string_agg(DISTINCT confal_score::text, ', ') AS value
        FROM ndb_struct_ntc_overall
        WHERE entry_id = ANY(${ids}::text[])
        GROUP BY entry_id
      `;
      break;
    case "helixLength":
      rows = await sql`
        SELECT entry_id AS "pdbId", string_agg(DISTINCT pdbx_pdb_helix_length::text, ', ') AS value
        FROM struct_conf
        WHERE entry_id = ANY(${ids}::text[])
        GROUP BY entry_id
      `;
      break;
    case "assignedNtc":
      rows = await sql`
        SELECT entry_id AS "pdbId", string_agg(DISTINCT assigned_ntc, ', ') AS value
        FROM ndb_struct_ntc_step_summary
        WHERE entry_id = ANY(${ids}::text[])
        GROUP BY entry_id
      `;
      break;
    case "entityName":
      rows = await sql`
        SELECT entry_id AS "pdbId", string_agg(DISTINCT pdbx_description, ', ') AS value
        FROM entity
        WHERE entry_id = ANY(${ids}::text[])
        GROUP BY entry_id
      `;
      break;
    case "sourceOrganism":
      rows = await sql`
        SELECT entry_id AS "pdbId", string_agg(DISTINCT pdbx_gene_src_scientific_name, ', ') AS value
        FROM entity_src_gen
        WHERE entry_id = ANY(${ids}::text[])
        GROUP BY entry_id
      `;
      break;
    case "polymerType":
      rows = await sql`
        SELECT entry_id AS "pdbId", string_agg(DISTINCT type, ', ') AS value
        FROM entity_poly
        WHERE entry_id = ANY(${ids}::text[])
        GROUP BY entry_id
      `;
      break;
    case "monomerFlag":
      rows = await sql`
        SELECT eps.entry_id AS "pdbId",
          CASE WHEN bool_or(cc.mon_nstd_flag = 'n') THEN 'n' ELSE 'y' END AS value
        FROM entity_poly_seq eps
        JOIN chem_comp cc ON cc.id = eps.mon_id
        WHERE eps.entry_id = ANY(${ids}::text[])
        GROUP BY eps.entry_id
      `;
      break;
    default:
      rows = [];
  }

  return new Map(rows.map(r => [r.pdbId, r.value ?? ""]));
}

export async function generateReportRows(
  params: SearchFilterParams,
  fields: ReportField[]
): Promise<{ headers: string[]; rows: string[][] }> {
  const selected = fields.length ? fields : (["pdbId"] as ReportField[]);

  const entries = await sql<{ pdbId: string }[]>`
    SELECT e.id AS "pdbId"
    FROM entry e
    WHERE ${buildSearchWhere(params)}
    ORDER BY e.id ASC
  `;
  const entryIds = entries.map(e => e.pdbId);
  const fieldsToFetch = selected.filter(f => f !== "pdbId");

  const valueMaps = entryIds.length
    ? await Promise.all(fieldsToFetch.map(f => fetchFieldValues(f, entryIds)))
    : fieldsToFetch.map(() => new Map<string, string>());
  const valuesByField = new Map(fieldsToFetch.map((f, i) => [f, valueMaps[i]]));

  const headers = selected.map(f => REPORT_FIELDS.find(rf => rf.key === f)!.label);
  const rows = entries.map(({ pdbId }) =>
    selected.map(f => (f === "pdbId" ? pdbId : valuesByField.get(f)?.get(pdbId) ?? ""))
  );

  return { headers, rows };
}

export function toCsv(headers: string[], rows: string[][]): string {
  const escape = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  return [headers, ...rows].map(row => row.map(escape).join(",")).join("\n");
}