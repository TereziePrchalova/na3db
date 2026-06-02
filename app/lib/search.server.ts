import { sql } from "~/lib/db.server";

export type SearchResult = {
  pdbId: string;
  title: string | null;
  method: string | null;
};

export async function searchEntries(params: {
  pdbId?: string;
  author?: string;
  experimentalMethod?: string;
  entityName?: string;
  sourceOrganism?: string;
  nonStandardResidue?: string;
  assignedNtc?: string;
  confalScoreMin?: string;
  confalScoreMax?: string;
  helixLengthMin?: string;
  helixLengthMax?: string;
  polymerType?: string;
  monomerFlag?: string;
}): Promise<SearchResult[]> {
  const expMethod = params.experimentalMethod && params.experimentalMethod !== "any"
    ? params.experimentalMethod : null;
  const polymerType = params.polymerType && params.polymerType !== "any"
    ? params.polymerType : null;
  const monomerFlag = params.monomerFlag && params.monomerFlag !== "any"
    ? params.monomerFlag : null;
  const confalMin = params.confalScoreMin ? parseFloat(params.confalScoreMin) : null;
  const confalMax = params.confalScoreMax ? parseFloat(params.confalScoreMax) : null;
  const helixMin = params.helixLengthMin ? parseInt(params.helixLengthMin) : null;
  const helixMax = params.helixLengthMax ? parseInt(params.helixLengthMax) : null;

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
    ${expMethod     ? sql`AND ex.method = ${expMethod}` : sql``}
    ${params.entityName ? sql`AND EXISTS (
      SELECT 1 FROM entity ent
      WHERE ent.entry_id = e.id
        AND ent.pdbx_description ILIKE ${'%' + params.entityName + '%'}
    )` : sql``}
    ${params.sourceOrganism ? sql`AND EXISTS (
      SELECT 1 FROM entity_src_gen esg
      WHERE esg.entry_id = e.id
        AND esg.pdbx_gene_src_scientific_name ILIKE ${'%' + params.sourceOrganism + '%'}
    )` : sql``}
    ${params.nonStandardResidue ? sql`AND EXISTS (
      SELECT 1 FROM entity_poly_seq eps
      JOIN chem_comp cc ON cc.id = eps.mon_id
      WHERE eps.entry_id = e.id
        AND cc.name ILIKE ${'%' + params.nonStandardResidue + '%'}
    )` : sql``}
    ${params.assignedNtc ? sql`AND EXISTS (
      SELECT 1 FROM ndb_struct_ntc_step_summary ntcss
      WHERE ntcss.entry_id = e.id
        AND ntcss.assigned_ntc ILIKE ${'%' + params.assignedNtc + '%'}
    )` : sql``}
    ${confalMin !== null && !isNaN(confalMin) ? sql`AND EXISTS (
      SELECT 1 FROM ndb_struct_ntc_overall ntco
      WHERE ntco.entry_id = e.id AND ntco.confal_score >= ${confalMin}
    )` : sql``}
    ${confalMax !== null && !isNaN(confalMax) ? sql`AND EXISTS (
      SELECT 1 FROM ndb_struct_ntc_overall ntco
      WHERE ntco.entry_id = e.id AND ntco.confal_score <= ${confalMax}
    )` : sql``}
    ${helixMin !== null && !isNaN(helixMin) ? sql`AND EXISTS (
      SELECT 1 FROM struct_conf sc
      WHERE sc.entry_id = e.id AND sc.pdbx_pdb_helix_length >= ${helixMin}
    )` : sql``}
    ${helixMax !== null && !isNaN(helixMax) ? sql`AND EXISTS (
      SELECT 1 FROM struct_conf sc
      WHERE sc.entry_id = e.id AND sc.pdbx_pdb_helix_length <= ${helixMax}
    )` : sql``}
    ${polymerType ? sql`AND EXISTS (
      SELECT 1 FROM entity_poly ep
      WHERE ep.entry_id = e.id AND ep.type = ${polymerType}
    )` : sql``}
    ${monomerFlag ? sql`AND EXISTS (
      SELECT 1 FROM entity_poly_seq eps2
      JOIN chem_comp cc2 ON cc2.id = eps2.mon_id
      WHERE eps2.entry_id = e.id AND cc2.mon_nstd_flag = ${monomerFlag}
    )` : sql``}
    ORDER BY e.id ASC
  `;

  return rows;
}
