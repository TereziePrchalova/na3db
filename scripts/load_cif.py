#!/usr/bin/env python3
"""
Load mmCIF files into the na3db PostgreSQL database.

Usage:
    python scripts/load_cif.py /path/to/cif/folder
    python scripts/load_cif.py /path/to/cif/folder --atoms   # include atom_site (slow)

Dependencies:
    pip install gemmi psycopg2-binary

Environment variables (all have defaults for local Docker):
    DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
"""

import os
import sys
import glob
import argparse

import gemmi
import psycopg2


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def nil(v):
    if v is None or v in ('.', '?', ''):
        return None
    v = str(v).strip()
    return None if v in ('.', '?', '') else v


def to_int(v):
    v = nil(v)
    if v is None:
        return None
    try:
        return int(float(v))
    except (ValueError, TypeError):
        return None


def to_float(v):
    v = nil(v)
    if v is None:
        return None
    try:
        return float(v)
    except (ValueError, TypeError):
        return None


def find_val(block, tag):
    try:
        return nil(block.find_value(tag))
    except Exception:
        return None


def find_loop(block, prefix, columns):
    try:
        return block.find(prefix, columns)
    except Exception:
        return []


# ---------------------------------------------------------------------------
# Tier 1 — Entry core
# ---------------------------------------------------------------------------

def load_entry(cur, entry_id):
    cur.execute(
        "INSERT INTO entry (id) VALUES (%s) ON CONFLICT DO NOTHING",
        (entry_id,)
    )


def load_pdbx_database_status(cur, block, entry_id):
    cur.execute("""
        INSERT INTO pdbx_database_status
            (entry_id, status_code, recvd_initial_deposition_date,
             deposit_site, process_site, status_code_sf, pdb_format_compatible)
        VALUES (%s,%s,%s,%s,%s,%s,%s)
        ON CONFLICT DO NOTHING
    """, (
        entry_id,
        find_val(block, '_pdbx_database_status.status_code'),
        find_val(block, '_pdbx_database_status.recvd_initial_deposition_date'),
        find_val(block, '_pdbx_database_status.deposit_site'),
        find_val(block, '_pdbx_database_status.process_site'),
        find_val(block, '_pdbx_database_status.status_code_sf'),
        find_val(block, '_pdbx_database_status.pdb_format_compatible'),
    ))


def load_struct(cur, block, entry_id):
    cur.execute("""
        INSERT INTO struct (entry_id, title) VALUES (%s,%s) ON CONFLICT DO NOTHING
    """, (entry_id, find_val(block, '_struct.title')))


def load_citation(cur, block, entry_id):
    rows = find_loop(block, '_citation.', [
        'id', 'title', 'journal_abbrev', 'journal_volume',
        'page_first', 'page_last', 'year',
        'journal_id_ASTM', 'country', 'journal_id_ISSN', 'journal_id_CSD',
        'book_publisher', 'pdbx_database_id_PubMed', 'pdbx_database_id_DOI',
    ])
    for r in rows:
        cur.execute("""
            INSERT INTO citation
                (id, entry_id, title, journal_abbrev, journal_volume,
                 page_first, page_last, year,
                 journal_id_astm, country, journal_id_issn, journal_id_csd,
                 book_publisher, pdbx_database_id_pubmed, pdbx_database_id_doi)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            ON CONFLICT DO NOTHING
        """, (
            nil(r[0]), entry_id, nil(r[1]), nil(r[2]), nil(r[3]),
            nil(r[4]), nil(r[5]), to_int(r[6]),
            nil(r[7]), nil(r[8]), nil(r[9]), nil(r[10]),
            nil(r[11]), to_int(r[12]), nil(r[13]),
        ))


def load_citation_author(cur, block, entry_id):
    rows = find_loop(block, '_citation_author.', [
        'citation_id', 'name', 'ordinal', 'identifier_ORCID',
    ])
    for r in rows:
        cur.execute("""
            INSERT INTO citation_author
                (entry_id, citation_id, name, ordinal, identifier_orcid)
            VALUES (%s,%s,%s,%s,%s)
        """, (entry_id, nil(r[0]), nil(r[1]), to_int(r[2]), nil(r[3])))


# ---------------------------------------------------------------------------
# Tier 2 — Molecules
# ---------------------------------------------------------------------------

def load_entity(cur, block, entry_id):
    rows = find_loop(block, '_entity.', [
        'id', 'type', 'pdbx_description', 'formula_weight', 'pdbx_number_of_molecules',
    ])
    for r in rows:
        cur.execute("""
            INSERT INTO entity
                (id, entry_id, type, pdbx_description, formula_weight, pdbx_number_of_molecules)
            VALUES (%s,%s,%s,%s,%s,%s) ON CONFLICT DO NOTHING
        """, (nil(r[0]), entry_id, nil(r[1]), nil(r[2]), to_float(r[3]), to_int(r[4])))


def load_entity_poly(cur, block, entry_id):
    rows = find_loop(block, '_entity_poly.', [
        'entity_id', 'type', 'pdbx_seq_one_letter_code_can',
    ])
    for r in rows:
        cur.execute("""
            INSERT INTO entity_poly (entity_id, entry_id, type, pdbx_seq_one_letter_code_can)
            VALUES (%s,%s,%s,%s) ON CONFLICT DO NOTHING
        """, (nil(r[0]), entry_id, nil(r[1]), nil(r[2])))


def load_entity_poly_seq(cur, block, entry_id):
    rows = find_loop(block, '_entity_poly_seq.', ['entity_id', 'num', 'mon_id', 'hetero'])
    for r in rows:
        cur.execute("""
            INSERT INTO entity_poly_seq (entity_id, entry_id, num, mon_id, hetero)
            VALUES (%s,%s,%s,%s,%s)
        """, (nil(r[0]), entry_id, to_int(r[1]), nil(r[2]), nil(r[3])))


def load_entity_src_gen(cur, block, entry_id):
    rows = find_loop(block, '_entity_src_gen.', [
        'entity_id', 'gene_src_common_name',
        'pdbx_gene_src_scientific_name', 'pdbx_gene_src_ncbi_taxonomy_id',
    ])
    for r in rows:
        cur.execute("""
            INSERT INTO entity_src_gen
                (entity_id, entry_id, gene_src_common_name,
                 pdbx_gene_src_scientific_name, pdbx_gene_src_ncbi_taxonomy_id)
            VALUES (%s,%s,%s,%s,%s)
        """, (nil(r[0]), entry_id, nil(r[1]), nil(r[2]), to_int(r[3])))


def load_pdbx_entity_nonpoly(cur, block, entry_id):
    rows = find_loop(block, '_pdbx_entity_nonpoly.', ['entity_id', 'name', 'comp_id'])
    for r in rows:
        cur.execute("""
            INSERT INTO pdbx_entity_nonpoly (entity_id, entry_id, name, comp_id)
            VALUES (%s,%s,%s,%s) ON CONFLICT DO NOTHING
        """, (nil(r[0]), entry_id, nil(r[1]), nil(r[2])))


# ---------------------------------------------------------------------------
# Tier 3 — Chains
# ---------------------------------------------------------------------------

def load_struct_asym(cur, block, entry_id):
    rows = find_loop(block, '_struct_asym.', ['id', 'entity_id', 'details'])
    for r in rows:
        cur.execute("""
            INSERT INTO struct_asym (id, entry_id, entity_id, details)
            VALUES (%s,%s,%s,%s) ON CONFLICT DO NOTHING
        """, (nil(r[0]), entry_id, nil(r[1]), nil(r[2])))


# ---------------------------------------------------------------------------
# Tier 6 — Crystallography
# ---------------------------------------------------------------------------

def load_exptl(cur, block, entry_id):
    cur.execute("""
        INSERT INTO exptl (entry_id, method, crystals_number)
        VALUES (%s,%s,%s) ON CONFLICT DO NOTHING
    """, (
        entry_id,
        find_val(block, '_exptl.method'),
        to_int(find_val(block, '_exptl.crystals_number')),
    ))


def load_cell(cur, block, entry_id):
    cur.execute("""
        INSERT INTO cell
            (entry_id, length_a, length_b, length_c,
             angle_alpha, angle_beta, angle_gamma, z_pdb)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s) ON CONFLICT DO NOTHING
    """, (
        entry_id,
        to_float(find_val(block, '_cell.length_a')),
        to_float(find_val(block, '_cell.length_b')),
        to_float(find_val(block, '_cell.length_c')),
        to_float(find_val(block, '_cell.angle_alpha')),
        to_float(find_val(block, '_cell.angle_beta')),
        to_float(find_val(block, '_cell.angle_gamma')),
        to_int(find_val(block, '_cell.Z_PDB')),
    ))


def load_symmetry(cur, block, entry_id):
    cur.execute("""
        INSERT INTO symmetry (entry_id, space_group_name_H_M, int_tables_number)
        VALUES (%s,%s,%s) ON CONFLICT DO NOTHING
    """, (
        entry_id,
        find_val(block, '_symmetry.space_group_name_H-M'),
        to_int(find_val(block, '_symmetry.Int_Tables_number')),
    ))


def load_diffrn(cur, block, entry_id):
    rows = find_loop(block, '_diffrn.', ['id', 'ambient_temp'])
    for r in rows:
        cur.execute("""
            INSERT INTO diffrn (id, entry_id, ambient_temp)
            VALUES (%s,%s,%s) ON CONFLICT DO NOTHING
        """, (nil(r[0]), entry_id, to_float(r[1])))


def load_reflns(cur, block, entry_id):
    cur.execute("""
        INSERT INTO reflns
            (entry_id, observed_criterion_sigma_I, observed_criterion_sigma_F,
             d_resolution_low, d_resolution_high, number_obs, number_all, percent_possible_obs)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s) ON CONFLICT DO NOTHING
    """, (
        entry_id,
        to_float(find_val(block, '_reflns.observed_criterion_sigma_I')),
        to_float(find_val(block, '_reflns.observed_criterion_sigma_F')),
        to_float(find_val(block, '_reflns.d_resolution_low')),
        to_float(find_val(block, '_reflns.d_resolution_high')),
        to_int(find_val(block, '_reflns.number_obs')),
        to_int(find_val(block, '_reflns.number_all')),
        to_float(find_val(block, '_reflns.percent_possible_obs')),
    ))


# ---------------------------------------------------------------------------
# Tier 5 — Secondary structure
# ---------------------------------------------------------------------------

def load_struct_conf(cur, block, entry_id):
    rows = find_loop(block, '_struct_conf.', [
        'id', 'conf_type_id', 'pdbx_PDB_helix_id',
        'beg_label_comp_id', 'beg_label_asym_id', 'beg_label_seq_id', 'pdbx_beg_PDB_ins_code',
        'end_label_comp_id', 'end_label_asym_id', 'end_label_seq_id', 'pdbx_end_PDB_ins_code',
        'beg_auth_comp_id', 'beg_auth_asym_id', 'beg_auth_seq_id',
        'end_auth_comp_id', 'end_auth_asym_id', 'end_auth_seq_id',
        'pdbx_PDB_helix_class', 'details', 'pdbx_PDB_helix_length',
    ])
    seen_types = set()
    for r in rows:
        ct = nil(r[1])
        if ct and ct not in seen_types:
            cur.execute(
                "INSERT INTO struct_conf_type (id) VALUES (%s) ON CONFLICT DO NOTHING",
                (ct,)
            )
            seen_types.add(ct)
    for r in rows:
        cur.execute("""
            INSERT INTO struct_conf
                (id, entry_id, conf_type_id, pdbx_pdb_helix_id,
                 beg_label_comp_id, beg_label_asym_id, beg_label_seq_id, pdbx_beg_pdb_ins_code,
                 end_label_comp_id, end_label_asym_id, end_label_seq_id, pdbx_end_pdb_ins_code,
                 beg_auth_comp_id, beg_auth_asym_id, beg_auth_seq_id,
                 end_auth_comp_id, end_auth_asym_id, end_auth_seq_id,
                 pdbx_pdb_helix_class, details, pdbx_pdb_helix_length)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            ON CONFLICT DO NOTHING
        """, (
            nil(r[0]), entry_id, nil(r[1]), nil(r[2]),
            nil(r[3]), nil(r[4]), to_int(r[5]), nil(r[6]),
            nil(r[7]), nil(r[8]), to_int(r[9]), nil(r[10]),
            nil(r[11]), nil(r[12]), nil(r[13]),
            nil(r[14]), nil(r[15]), nil(r[16]),
            nil(r[17]), nil(r[18]), to_int(r[19]),
        ))


# ---------------------------------------------------------------------------
# Tier 7 — Chemistry
# ---------------------------------------------------------------------------

def load_chem_comp(cur, block):
    rows = find_loop(block, '_chem_comp.', [
        'id', 'type', 'mon_nstd_flag', 'name', 'pdbx_synonyms', 'formula', 'formula_weight',
    ])
    for r in rows:
        cur.execute("""
            INSERT INTO chem_comp
                (id, type, mon_nstd_flag, name, pdbx_synonyms, formula, formula_weight)
            VALUES (%s,%s,%s,%s,%s,%s,%s) ON CONFLICT DO NOTHING
        """, (nil(r[0]), nil(r[1]), nil(r[2]), nil(r[3]), nil(r[4]), nil(r[5]), to_float(r[6])))


# ---------------------------------------------------------------------------
# Tier 8 — NtC RNA annotations
# ---------------------------------------------------------------------------

def load_ntc_overall(cur, block, entry_id):
    score = find_val(block, '_ndb_struct_ntc_overall.confal_score')
    if score is None:
        return
    cur.execute("""
        INSERT INTO ndb_struct_ntc_overall
            (entry_id, confal_score, confal_percentile, ntc_version, cana_version,
             num_steps, num_classified, num_unclassified, num_unclassified_rmsd_close)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s) ON CONFLICT DO NOTHING
    """, (
        entry_id,
        to_float(score),
        to_int(find_val(block, '_ndb_struct_ntc_overall.confal_percentile')),
        find_val(block, '_ndb_struct_ntc_overall.ntc_version'),
        find_val(block, '_ndb_struct_ntc_overall.cana_version'),
        to_int(find_val(block, '_ndb_struct_ntc_overall.num_steps')),
        to_int(find_val(block, '_ndb_struct_ntc_overall.num_classified')),
        to_int(find_val(block, '_ndb_struct_ntc_overall.num_unclassified')),
        to_int(find_val(block, '_ndb_struct_ntc_overall.num_unclassified_rmsd_close')),
    ))


def load_ntc_step(cur, block, entry_id):
    rows = find_loop(block, '_ndb_struct_ntc_step.', [
        'id', 'name', 'PDB_model_number',
        'label_entity_id_1', 'label_asym_id_1', 'label_seq_id_1', 'label_comp_id_1', 'label_alt_id_1',
        'label_entity_id_2', 'label_asym_id_2', 'label_seq_id_2', 'label_comp_id_2', 'label_alt_id_2',
        'auth_asym_id_1', 'auth_seq_id_1', 'auth_asym_id_2', 'auth_seq_id_2',
        'PDB_ins_code_1', 'PDB_ins_code_2',
    ])
    for r in rows:
        cur.execute("""
            INSERT INTO ndb_struct_ntc_step
                (id, entry_id, name, pdb_model_number,
                 label_entity_id_1, label_asym_id_1, label_seq_id_1, label_comp_id_1, label_alt_id_1,
                 label_entity_id_2, label_asym_id_2, label_seq_id_2, label_comp_id_2, label_alt_id_2,
                 auth_asym_id_1, auth_seq_id_1, auth_asym_id_2, auth_seq_id_2,
                 pdb_ins_code_1, pdb_ins_code_2)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            ON CONFLICT DO NOTHING
        """, (
            to_int(r[0]), entry_id, nil(r[1]), to_int(r[2]),
            nil(r[3]), nil(r[4]), to_int(r[5]), nil(r[6]), nil(r[7]),
            nil(r[8]), nil(r[9]), to_int(r[10]), nil(r[11]), nil(r[12]),
            nil(r[13]), nil(r[14]), nil(r[15]), nil(r[16]),
            nil(r[17]), nil(r[18]),
        ))


def load_ntc_step_summary(cur, block, entry_id):
    rows = find_loop(block, '_ndb_struct_ntc_step_summary.', [
        'step_id', 'assigned_CANA', 'assigned_NtC', 'confal_score',
        'euclidean_distance_NtC_ideal', 'cartesian_rmsd_closest_NtC_representative',
        'closest_CANA', 'closest_NtC', 'closest_step_golden',
    ])
    for r in rows:
        cur.execute("""
            INSERT INTO ndb_struct_ntc_step_summary
                (step_id, entry_id, assigned_cana, assigned_ntc, confal_score,
                 euclidean_distance_NtC_ideal, cartesian_rmsd_closest_NtC_representative,
                 closest_cana, closest_ntc, closest_step_golden)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) ON CONFLICT DO NOTHING
        """, (
            to_int(r[0]), entry_id, nil(r[1]), nil(r[2]), to_float(r[3]),
            to_float(r[4]), to_float(r[5]),
            nil(r[6]), nil(r[7]), nil(r[8]),
        ))


def load_ntc_step_parameters(cur, block, entry_id):
    float_cols = [
        'tor_delta_1', 'tor_epsilon_1', 'tor_zeta_1', 'tor_alpha_2', 'tor_beta_2',
        'tor_gamma_2', 'tor_delta_2', 'tor_chi_1', 'tor_chi_2',
        'dist_NN', 'dist_CC', 'tor_NCCN',
        'diff_tor_delta_1', 'diff_tor_epsilon_1', 'diff_tor_zeta_1', 'diff_tor_alpha_2',
        'diff_tor_beta_2', 'diff_tor_gamma_2', 'diff_tor_delta_2', 'diff_tor_chi_1',
        'diff_tor_chi_2', 'diff_dist_NN', 'diff_dist_CC', 'diff_tor_NCCN',
        'confal_tor_delta_1', 'confal_tor_epsilon_1', 'confal_tor_zeta_1',
        'confal_tor_alpha_2', 'confal_tor_beta_2', 'confal_tor_gamma_2', 'confal_tor_delta_2',
        'confal_tor_chi_1', 'confal_tor_chi_2',
        'confal_dist_NN', 'confal_dist_CC', 'confal_tor_NCCN',
    ]
    all_cols = ['step_id'] + float_cols + ['details']
    rows = find_loop(block, '_ndb_struct_ntc_step_parameters.', all_cols)
    col_names = ', '.join(all_cols[1:])  # skip step_id, added separately
    placeholders = ', '.join(['%s'] * (len(all_cols) + 1))  # +1 for entry_id

    for r in rows:
        vals = [to_int(r[0]), entry_id]
        vals += [to_float(r[i]) for i in range(1, len(float_cols) + 1)]
        vals.append(nil(r[-1]))
        cur.execute(f"""
            INSERT INTO ndb_struct_ntc_step_parameters
                (step_id, entry_id, {col_names})
            VALUES ({placeholders}) ON CONFLICT DO NOTHING
        """, vals)


def load_sugar_step_parameters(cur, block, entry_id):
    cols = [
        'step_id', 'P_1', 'tau_1', 'Pn_1', 'P_2', 'tau_2', 'Pn_2',
        'nu_1_1', 'nu_1_2', 'nu_1_3', 'nu_1_4', 'nu_1_5',
        'nu_2_1', 'nu_2_2', 'nu_2_3', 'nu_2_4', 'nu_2_5',
        'diff_nu_1_1', 'diff_nu_1_2', 'diff_nu_1_3', 'diff_nu_1_4', 'diff_nu_1_5',
        'diff_nu_2_1', 'diff_nu_2_2', 'diff_nu_2_3', 'diff_nu_2_4', 'diff_nu_2_5',
    ]
    str_idxs = {3, 6}  # Pn_1, Pn_2 are text
    rows = find_loop(block, '_ndb_struct_sugar_step_parameters.', cols)
    for r in rows:
        vals = [to_int(r[0]), entry_id]
        for i in range(1, len(cols)):
            vals.append(nil(r[i]) if i in str_idxs else to_float(r[i]))
        cur.execute("""
            INSERT INTO ndb_struct_sugar_step_parameters
                (step_id, entry_id,
                 p_1, tau_1, pn_1, p_2, tau_2, pn_2,
                 nu_1_1, nu_1_2, nu_1_3, nu_1_4, nu_1_5,
                 nu_2_1, nu_2_2, nu_2_3, nu_2_4, nu_2_5,
                 diff_nu_1_1, diff_nu_1_2, diff_nu_1_3, diff_nu_1_4, diff_nu_1_5,
                 diff_nu_2_1, diff_nu_2_2, diff_nu_2_3, diff_nu_2_4, diff_nu_2_5)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            ON CONFLICT DO NOTHING
        """, vals)


def load_base_pair_list(cur, block, entry_id):
    rows = find_loop(block, '_ndb_base_pair_list.', [
        'base_pair_id', 'PDB_model_number',
        'asym_id_1', 'entity_id_1', 'seq_id_1', 'comp_id_1',
        'PDB_ins_code_1', 'alt_id_1', 'struct_oper_id_1',
        'asym_id_2', 'entity_id_2', 'seq_id_2', 'comp_id_2',
        'PDB_ins_code_2', 'alt_id_2', 'struct_oper_id_2',
        'auth_asym_id_1', 'auth_seq_id_1', 'auth_asym_id_2', 'auth_seq_id_2',
    ])
    for r in rows:
        cur.execute("""
            INSERT INTO ndb_base_pair_list
                (base_pair_id, entry_id, pdb_model_number,
                 asym_id_1, entity_id_1, seq_id_1, comp_id_1,
                 pdb_ins_code_1, alt_id_1, struct_oper_id_1,
                 asym_id_2, entity_id_2, seq_id_2, comp_id_2,
                 pdb_ins_code_2, alt_id_2, struct_oper_id_2,
                 auth_asym_id_1, auth_seq_id_1, auth_asym_id_2, auth_seq_id_2)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            ON CONFLICT DO NOTHING
        """, (
            to_int(r[0]), entry_id, to_int(r[1]),
            nil(r[2]), nil(r[3]), to_int(r[4]), nil(r[5]),
            nil(r[6]), nil(r[7]), nil(r[8]),
            nil(r[9]), nil(r[10]), to_int(r[11]), nil(r[12]),
            nil(r[13]), nil(r[14]), nil(r[15]),
            nil(r[16]), nil(r[17]), nil(r[18]), nil(r[19]),
        ))


def load_base_pair_annotation(cur, block, entry_id):
    rows = find_loop(block, '_ndb_base_pair_annotation.', [
        'id', 'base_pair_id', 'orientation', 'base_1_edge', 'base_2_edge',
        'l-w_family_num', 'l-w_family', 'class', 'subclass',
    ])
    for r in rows:
        cur.execute("""
            INSERT INTO ndb_base_pair_annotation
                (base_pair_id, entry_id, orientation, base_1_edge, base_2_edge,
                 lw_family_num, lw_family, class, subclass)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (
            to_int(r[1]), entry_id, nil(r[2]), nil(r[3]), nil(r[4]),
            to_int(r[5]), nil(r[6]), nil(r[7]), nil(r[8]),
        ))


# ---------------------------------------------------------------------------
# Tier 4 — Atom coordinates (optional, large)
# ---------------------------------------------------------------------------

def load_atom_site(cur, block, entry_id):
    rows = find_loop(block, '_atom_site.', [
        'group_PDB', 'type_symbol', 'label_atom_id', 'label_alt_id',
        'label_comp_id', 'label_asym_id', 'label_entity_id', 'label_seq_id',
        'Cartn_x', 'Cartn_y', 'Cartn_z', 'occupancy', 'B_iso_or_equiv',
        'auth_seq_id', 'auth_asym_id', 'auth_comp_id', 'auth_atom_id',
        'pdbx_PDB_model_num', 'pdbx_formal_charge', 'pdbx_PDB_ins_code',
    ])
    batch = []
    for r in rows:
        batch.append((
            entry_id,
            nil(r[0]), nil(r[1]), nil(r[2]), nil(r[3]),
            nil(r[4]), nil(r[5]), nil(r[6]), to_int(r[7]),
            to_float(r[8]), to_float(r[9]), to_float(r[10]),
            to_float(r[11]), to_float(r[12]),
            nil(r[13]), nil(r[14]), nil(r[15]), nil(r[16]),
            to_int(r[17]), to_int(r[18]), nil(r[19]),
        ))
        if len(batch) >= 5000:
            _insert_atom_batch(cur, batch)
            batch.clear()
    if batch:
        _insert_atom_batch(cur, batch)


def _insert_atom_batch(cur, batch):
    from psycopg2.extras import execute_values
    execute_values(cur, """
        INSERT INTO atom_site
            (entry_id, group_pdb, type_symbol, label_atom_id, label_alt_id,
             label_comp_id, label_asym_id, label_entity_id, label_seq_id,
             cartn_x, cartn_y, cartn_z, occupancy, b_iso_or_equiv,
             auth_seq_id, auth_asym_id, auth_comp_id, auth_atom_id,
             pdbx_PDB_model_num, pdbx_formal_charge, pdbx_pdb_ins_code)
        VALUES %s
    """, batch)


# ---------------------------------------------------------------------------
# Main loader
# ---------------------------------------------------------------------------

def load_block(cur, block, include_atoms=False):
    entry_id = find_val(block, '_entry.id') or block.name
    entry_id = entry_id.strip()

    load_entry(cur, entry_id)
    load_pdbx_database_status(cur, block, entry_id)
    load_struct(cur, block, entry_id)
    load_citation(cur, block, entry_id)
    load_citation_author(cur, block, entry_id)
    load_entity(cur, block, entry_id)
    load_entity_poly(cur, block, entry_id)
    load_entity_poly_seq(cur, block, entry_id)
    load_entity_src_gen(cur, block, entry_id)
    load_pdbx_entity_nonpoly(cur, block, entry_id)
    load_struct_asym(cur, block, entry_id)
    load_chem_comp(cur, block)
    load_exptl(cur, block, entry_id)
    load_cell(cur, block, entry_id)
    load_symmetry(cur, block, entry_id)
    load_diffrn(cur, block, entry_id)
    load_reflns(cur, block, entry_id)
    load_struct_conf(cur, block, entry_id)
    load_ntc_overall(cur, block, entry_id)
    load_ntc_step(cur, block, entry_id)
    load_ntc_step_summary(cur, block, entry_id)
    load_ntc_step_parameters(cur, block, entry_id)
    load_sugar_step_parameters(cur, block, entry_id)
    load_base_pair_list(cur, block, entry_id)
    load_base_pair_annotation(cur, block, entry_id)

    if include_atoms:
        load_atom_site(cur, block, entry_id)


def main():
    parser = argparse.ArgumentParser(description='Load mmCIF files into na3db')
    parser.add_argument('cif_dir', help='Folder containing .cif files')
    parser.add_argument('--atoms', action='store_true', help='Also load atom_site (slow, large)')
    args = parser.parse_args()

    files = sorted(set(
        glob.glob(os.path.join(args.cif_dir, '*.cif')) +
        glob.glob(os.path.join(args.cif_dir, '**', '*.cif'), recursive=True)
    ))

    if not files:
        print(f'No .cif files found in {args.cif_dir}')
        sys.exit(1)

    conn = psycopg2.connect(
        host=os.environ.get('DB_HOST', '127.0.0.1'),
        port=int(os.environ.get('DB_PORT', '5432')),
        user=os.environ.get('DB_USER', 'appuser'),
        password=os.environ.get('DB_PASSWORD', 'apppassword'),
        dbname=os.environ.get('DB_NAME', 'na3db'),
    )

    errors = []
    for i, filepath in enumerate(files, 1):
        name = os.path.basename(filepath)
        print(f'[{i}/{len(files)}] {name}', end=' ', flush=True)
        try:
            doc = gemmi.cif.read(filepath)
            block = doc.sole_block()
            with conn:
                cur = conn.cursor()
                load_block(cur, block, include_atoms=args.atoms)
            print('OK')
        except Exception as e:
            conn.rollback()
            errors.append((name, str(e)))
            print(f'ERROR: {e}')

    conn.close()

    if errors:
        print(f'\n{len(errors)} file(s) failed:')
        for name, err in errors:
            print(f'  {name}: {err}')
        sys.exit(1)
    else:
        print(f'\nAll {len(files)} files loaded successfully.')


if __name__ == '__main__':
    main()
