CREATE DATABASE IF NOT EXISTS na3db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE na3db;

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
--  TIER 1 — ENTRY CORE
-- ============================================================

-- T1-01  entry  ── ABSOLUTE ROOT ──────────────────────────────
-- One row per PDB structure.  Every other table references this.
CREATE TABLE IF NOT EXISTS entry (
    id  VARCHAR(20) NOT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='ROOT. One row per PDB entry. All other tables reference this.';


-- T1-02  pdbx_database_status  ────────────────────────────────
-- Deposition and release status. 1:1 with entry.
CREATE TABLE IF NOT EXISTS pdbx_database_status (
    entry_id                      VARCHAR(20) NOT NULL,
    status_code                   VARCHAR(10),
    recvd_initial_deposition_date DATE,
    deposit_site                  VARCHAR(20),
    process_site                  VARCHAR(20),
    status_code_sf                VARCHAR(10),
    pdb_format_compatible         VARCHAR(5),
    PRIMARY KEY (entry_id),
    CONSTRAINT fk_dbs_entry
        FOREIGN KEY (entry_id) REFERENCES entry(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- T1-03  struct  ──────────────────────────────────────────────
-- Structure title. 1:1 with entry.
CREATE TABLE IF NOT EXISTS struct (
    entry_id VARCHAR(20) NOT NULL,
    title    TEXT,
    PRIMARY KEY (entry_id),
    CONSTRAINT fk_struct_entry
        FOREIGN KEY (entry_id) REFERENCES entry(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- T1-04  citation  ────────────────────────────────────────────
-- Publications. PK=(id, entry_id) because id='primary' repeats
-- across every structure — cannot use id alone as PK.
CREATE TABLE IF NOT EXISTS citation (
    id                      VARCHAR(30) NOT NULL,
    entry_id                VARCHAR(20) NOT NULL,
    title                   TEXT,
    journal_abbrev          VARCHAR(255),
    journal_volume          VARCHAR(50),
    page_first              VARCHAR(20),
    page_last               VARCHAR(20),
    year                    SMALLINT,
    journal_id_ASTM         VARCHAR(20),
    country                 VARCHAR(10),
    journal_id_ISSN         VARCHAR(20),
    journal_id_CSD          VARCHAR(20),
    book_publisher          VARCHAR(255),
    pdbx_database_id_PubMed INT,
    pdbx_database_id_DOI    VARCHAR(255),
    PRIMARY KEY (id, entry_id),
    KEY idx_cit_entry (entry_id),
    CONSTRAINT fk_cit_entry
        FOREIGN KEY (entry_id) REFERENCES entry(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- T1-05  citation_author  ─────────────────────────────────────
-- Authors for each citation.
-- FK (composite): (citation_id, entry_id) → citation(id, entry_id)
CREATE TABLE IF NOT EXISTS citation_author (
    id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
    entry_id         VARCHAR(20)  NOT NULL,
    citation_id      VARCHAR(30)  NOT NULL,
    name             VARCHAR(255),
    ordinal          INT,
    identifier_ORCID VARCHAR(50),
    PRIMARY KEY (id),
    KEY idx_ca_entry    (entry_id),
    KEY idx_ca_citation (citation_id, entry_id),
    CONSTRAINT fk_ca_entry
        FOREIGN KEY (entry_id) REFERENCES entry(id) ON DELETE CASCADE,
    CONSTRAINT fk_ca_citation
        FOREIGN KEY (citation_id, entry_id)
        REFERENCES citation(id, entry_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
--  TIER 2 — MOLECULES
-- ============================================================

-- T2-01  entity  ──────────────────────────────────────────────
-- One row per distinct molecule in the ASU (polymer / non-polymer / water).
-- Fields excluded (professor "no"): src_method, pdbx_ec, pdbx_mutation,
--   pdbx_fragment, details.
CREATE TABLE IF NOT EXISTS entity (
    id                       VARCHAR(20) NOT NULL,
    entry_id                 VARCHAR(20) NOT NULL,
    type                     VARCHAR(50),
    pdbx_description         TEXT,
    formula_weight           FLOAT,
    pdbx_number_of_molecules INT,
    PRIMARY KEY (id, entry_id),
    KEY idx_ent_entry (entry_id),
    CONSTRAINT fk_ent_entry
        FOREIGN KEY (entry_id) REFERENCES entry(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- T2-02  entity_poly  ─────────────────────────────────────────
-- Polymer type + canonical one-letter sequence.
-- Professor note: use pdbx_seq_one_letter_code_can directly.
-- MEDIUMTEXT for long RNA/DNA sequences.
CREATE TABLE IF NOT EXISTS entity_poly (
    entity_id                    VARCHAR(20)  NOT NULL,
    entry_id                     VARCHAR(20)  NOT NULL,
    type                         VARCHAR(100),
    pdbx_seq_one_letter_code_can MEDIUMTEXT,
    PRIMARY KEY (entity_id, entry_id),
    KEY idx_epoly_entry (entry_id),
    CONSTRAINT fk_epoly_entity
        FOREIGN KEY (entity_id, entry_id)
        REFERENCES entity(id, entry_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- T2-03  entity_poly_seq  ─────────────────────────────────────
-- Residue-by-residue 3-letter code sequence.
CREATE TABLE IF NOT EXISTS entity_poly_seq (
    id        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    entity_id VARCHAR(20)     NOT NULL,
    entry_id  VARCHAR(20)     NOT NULL,
    num       INT,
    mon_id    VARCHAR(10),
    hetero    VARCHAR(5),
    PRIMARY KEY (id),
    KEY idx_eps_entry  (entry_id),
    KEY idx_eps_entity (entity_id, entry_id),
    CONSTRAINT fk_eps_entity
        FOREIGN KEY (entity_id, entry_id)
        REFERENCES entity(id, entry_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- T2-04  entity_src_gen  ──────────────────────────────────────
-- Gene source. Only 3 fields kept (professor "no" on all others).
CREATE TABLE IF NOT EXISTS entity_src_gen (
    id                             INT UNSIGNED NOT NULL AUTO_INCREMENT,
    entity_id                      VARCHAR(20)  NOT NULL,
    entry_id                       VARCHAR(20)  NOT NULL,
    gene_src_common_name           VARCHAR(255),
    pdbx_gene_src_scientific_name  VARCHAR(255),
    pdbx_gene_src_ncbi_taxonomy_id INT,
    PRIMARY KEY (id),
    KEY idx_esgen_entry  (entry_id),
    KEY idx_esgen_entity (entity_id, entry_id),
    CONSTRAINT fk_esgen_entity
        FOREIGN KEY (entity_id, entry_id)
        REFERENCES entity(id, entry_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- T2-05  pdbx_entity_nonpoly  ─────────────────────────────────
-- Ligands, ions, water. comp_id soft-refs chem_comp (Tier 7).
CREATE TABLE IF NOT EXISTS pdbx_entity_nonpoly (
    entity_id VARCHAR(20) NOT NULL,
    entry_id  VARCHAR(20) NOT NULL,
    name      VARCHAR(255),
    comp_id   VARCHAR(10),
    PRIMARY KEY (entity_id, entry_id),
    KEY idx_enp_entry (entry_id),
    CONSTRAINT fk_enp_entity
        FOREIGN KEY (entity_id, entry_id)
        REFERENCES entity(id, entry_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
--  TIER 3 — CHAINS & SEQUENCE MAPPING
-- ============================================================

-- T3-01  struct_asym  ─────────────────────────────────────────
-- Asymmetric unit chain IDs (A, B, C…). Maps chain → entity.
-- atom_site has a FK to this table, so it must be loaded first.
-- TWO FKs: entry_id → entry, AND (entity_id, entry_id) → entity.
CREATE TABLE IF NOT EXISTS struct_asym (
    id        VARCHAR(20) NOT NULL,
    entry_id  VARCHAR(20) NOT NULL,
    entity_id VARCHAR(20) NOT NULL,
    details   TEXT,
    PRIMARY KEY (id, entry_id),
    KEY idx_asym_entry  (entry_id),
    KEY idx_asym_entity (entity_id, entry_id),
    CONSTRAINT fk_asym_entry
        FOREIGN KEY (entry_id) REFERENCES entry(id) ON DELETE CASCADE,
    CONSTRAINT fk_asym_entity
        FOREIGN KEY (entity_id, entry_id)
        REFERENCES entity(id, entry_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- T3-02  pdbx_poly_seq_scheme  ────────────────────────────────
-- "Probably the best sequence category" — professor comment.
-- Label ↔ author PDB residue numbering. All 12 fields included.
-- FK: (asym_id, entry_id) → struct_asym(id, entry_id)
CREATE TABLE IF NOT EXISTS pdbx_poly_seq_scheme (
    id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    asym_id       VARCHAR(20)     NOT NULL,
    entry_id      VARCHAR(20)     NOT NULL,
    entity_id     VARCHAR(20),
    seq_id        INT,
    mon_id        VARCHAR(10),
    ndb_seq_num   INT,
    pdb_seq_num   INT,
    auth_seq_num  VARCHAR(20),
    pdb_mon_id    VARCHAR(10),
    auth_mon_id   VARCHAR(10),
    pdb_strand_id VARCHAR(10),
    pdb_ins_code  VARCHAR(5),
    hetero        VARCHAR(5),
    PRIMARY KEY (id),
    KEY idx_pss_entry (entry_id),
    KEY idx_pss_chain (asym_id, entry_id),
    CONSTRAINT fk_pss_asym
        FOREIGN KEY (asym_id, entry_id)
        REFERENCES struct_asym(id, entry_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- T3-03  struct_ref  ──────────────────────────────────────────
-- Links entity to UniProt / GenBank / PDB.
-- PK=(id, entry_id): id='1','2' repeats across entries.
-- TWO FKs: entry_id → entry, AND (entity_id, entry_id) → entity.
CREATE TABLE IF NOT EXISTS struct_ref (
    id                VARCHAR(20)  NOT NULL,
    entry_id          VARCHAR(20)  NOT NULL,
    entity_id         VARCHAR(20)  NOT NULL,
    db_name           VARCHAR(50),
    db_code           VARCHAR(100),
    pdbx_db_accession VARCHAR(100),
    PRIMARY KEY (id, entry_id),
    KEY idx_sref_entry  (entry_id),
    KEY idx_sref_entity (entity_id, entry_id),
    CONSTRAINT fk_sref_entry
        FOREIGN KEY (entry_id) REFERENCES entry(id) ON DELETE CASCADE,
    CONSTRAINT fk_sref_entity
        FOREIGN KEY (entity_id, entry_id)
        REFERENCES entity(id, entry_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- T3-04  struct_ref_seq  ──────────────────────────────────────
-- PDB residue range ↔ UniProt/GenBank alignment coordinates.
-- FK: (ref_id, entry_id) → struct_ref(id, entry_id)
CREATE TABLE IF NOT EXISTS struct_ref_seq (
    align_id                    VARCHAR(20) NOT NULL,
    entry_id                    VARCHAR(20) NOT NULL,
    ref_id                      VARCHAR(20) NOT NULL,
    pdbx_PDB_id_code            VARCHAR(20),
    pdbx_strand_id              VARCHAR(10),
    seq_align_beg               INT,
    pdbx_seq_align_beg_ins_code VARCHAR(5),
    seq_align_end               INT,
    pdbx_seq_align_end_ins_code VARCHAR(5),
    pdbx_db_accession           VARCHAR(100),
    db_align_beg                INT,
    pdbx_db_align_beg_ins_code  VARCHAR(5),
    db_align_end                INT,
    pdbx_db_align_end_ins_code  VARCHAR(5),
    pdbx_auth_seq_align_beg     VARCHAR(20),
    pdbx_auth_seq_align_end     VARCHAR(20),
    PRIMARY KEY (align_id, entry_id),
    KEY idx_srseq_entry (entry_id),
    KEY idx_srseq_ref   (ref_id, entry_id),
    CONSTRAINT fk_srseq_entry
        FOREIGN KEY (entry_id) REFERENCES entry(id) ON DELETE CASCADE,
    CONSTRAINT fk_srseq_ref
        FOREIGN KEY (ref_id, entry_id)
        REFERENCES struct_ref(id, entry_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
--  TIER 4 — COORDINATE DATA
-- ============================================================

-- T4-01  atom_site  ───────────────────────────────────────────
-- Every atom: coordinates, B-factor, occupancy, ATOM/HETATM.
-- LARGEST TABLE — BIGINT AUTO_INCREMENT PK.
-- FK: (label_asym_id, entry_id) → struct_asym(id, entry_id)
--   guarantees every atom belongs to a known chain.
CREATE TABLE IF NOT EXISTS atom_site (
    id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    entry_id           VARCHAR(20)     NOT NULL,
    group_PDB          VARCHAR(10),
    type_symbol        VARCHAR(5),
    label_atom_id      VARCHAR(20),
    label_alt_id       VARCHAR(5),
    label_comp_id      VARCHAR(10),
    label_asym_id      VARCHAR(20)     NOT NULL,
    label_entity_id    VARCHAR(20),
    label_seq_id       INT,
    Cartn_x            FLOAT,
    Cartn_y            FLOAT,
    Cartn_z            FLOAT,
    occupancy          FLOAT,
    B_iso_or_equiv     FLOAT,
    auth_seq_id        VARCHAR(20),
    auth_asym_id       VARCHAR(10),
    auth_comp_id       VARCHAR(10),
    auth_atom_id       VARCHAR(20),
    pdbx_PDB_model_num INT,
    pdbx_formal_charge INT,
    pdbx_PDB_ins_code  VARCHAR(5),
    PRIMARY KEY (id),
    KEY idx_as_entry (entry_id),
    KEY idx_as_chain (label_asym_id, entry_id),
    KEY idx_as_model (entry_id, pdbx_PDB_model_num),
    CONSTRAINT fk_as_asym
        FOREIGN KEY (label_asym_id, entry_id)
        REFERENCES struct_asym(id, entry_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='All atom coordinates. LARGEST TABLE.';


-- T4-02  atom_sites  ──────────────────────────────────────────
-- Fractional-to-Cartesian transformation matrix. 1:1 with entry.
-- CIF bracket fields: fract_transf_matrix[1][1], fract_transf_vector[1]
-- MySQL columns use underscores: fract_transf_matrix_1_1, fract_transf_vector_1
CREATE TABLE IF NOT EXISTS atom_sites (
    entry_id                VARCHAR(20) NOT NULL,
    fract_transf_matrix_1_1 DOUBLE,
    fract_transf_matrix_1_2 DOUBLE,
    fract_transf_matrix_1_3 DOUBLE,
    fract_transf_matrix_2_1 DOUBLE,
    fract_transf_matrix_2_2 DOUBLE,
    fract_transf_matrix_2_3 DOUBLE,
    fract_transf_matrix_3_1 DOUBLE,
    fract_transf_matrix_3_2 DOUBLE,
    fract_transf_matrix_3_3 DOUBLE,
    fract_transf_vector_1   DOUBLE,
    fract_transf_vector_2   DOUBLE,
    fract_transf_vector_3   DOUBLE,
    PRIMARY KEY (entry_id),
    CONSTRAINT fk_ats_entry
        FOREIGN KEY (entry_id) REFERENCES entry(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='Fractional-to-Cartesian matrix. 1:1. CIF []→_ in column names.';


-- T4-03  database_PDB_matrix  ─────────────────────────────────
-- PDB ORIGX transform. 1:1 with entry.
-- CIF bracket fields: origx[1][1], origx_vector[1]
-- MySQL columns:       origx_1_1,   origx_vector_1
CREATE TABLE IF NOT EXISTS database_PDB_matrix (
    entry_id       VARCHAR(20) NOT NULL,
    origx_1_1      DOUBLE,
    origx_1_2      DOUBLE,
    origx_1_3      DOUBLE,
    origx_2_1      DOUBLE,
    origx_2_2      DOUBLE,
    origx_2_3      DOUBLE,
    origx_3_1      DOUBLE,
    origx_3_2      DOUBLE,
    origx_3_3      DOUBLE,
    origx_vector_1 DOUBLE,
    origx_vector_2 DOUBLE,
    origx_vector_3 DOUBLE,
    PRIMARY KEY (entry_id),
    CONSTRAINT fk_pdbmat_entry
        FOREIGN KEY (entry_id) REFERENCES entry(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='PDB ORIGX matrix. 1:1. CIF []→_ in column names.';



-- ============================================================
--  TIER 5 — SECONDARY STRUCTURE
-- ============================================================

-- T5-01  struct_conf_type  ─────────────────────────────────────
-- Shared helix/turn type dictionary: HELX_P, HELX_RH_3T, TURN_TY1_P …
-- NO entry_id — one shared vocabulary across all structures.
-- Loader seeds this table from conf_type_id values found in
-- struct_conf rows (INSERT IGNORE), so novel IDs never cause failures.
-- struct_conf references this via index only (no enforced FK).
CREATE TABLE IF NOT EXISTS struct_conf_type (
    id        VARCHAR(30) NOT NULL,
    criteria  TEXT,
    reference TEXT,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='Helix/turn type lookup. Shared, no entry_id. Auto-seeded by loader.';


-- T5-02  struct_conf  ─────────────────────────────────────────
-- Alpha-helices, 3-10 helices, pi-helices, turns.
-- conf_type_id is a SOFT reference to struct_conf_type (index only,
-- no FK constraint) — this prevents novel CIF type IDs from blocking
-- inserts. Loader always seeds struct_conf_type first.
-- PK=(id, entry_id) because id='H1','H2'… repeats across entries.
CREATE TABLE IF NOT EXISTS struct_conf (
    id                    VARCHAR(50) NOT NULL,
    entry_id              VARCHAR(20) NOT NULL,
    conf_type_id          VARCHAR(30),
    pdbx_PDB_helix_id     VARCHAR(10),
    beg_label_comp_id     VARCHAR(10),
    beg_label_asym_id     VARCHAR(20),
    beg_label_seq_id      INT,
    pdbx_beg_PDB_ins_code VARCHAR(5),
    end_label_comp_id     VARCHAR(10),
    end_label_asym_id     VARCHAR(20),
    end_label_seq_id      INT,
    pdbx_end_PDB_ins_code VARCHAR(5),
    beg_auth_comp_id      VARCHAR(10),
    beg_auth_asym_id      VARCHAR(10),
    beg_auth_seq_id       VARCHAR(20),
    end_auth_comp_id      VARCHAR(10),
    end_auth_asym_id      VARCHAR(10),
    end_auth_seq_id       VARCHAR(20),
    pdbx_PDB_helix_class  VARCHAR(5),
    details               TEXT,
    pdbx_PDB_helix_length INT,
    PRIMARY KEY (id, entry_id),
    KEY idx_sconf_entry (entry_id),
    KEY idx_sconf_type  (conf_type_id),
    CONSTRAINT fk_sconf_entry
        FOREIGN KEY (entry_id) REFERENCES entry(id) ON DELETE CASCADE
    -- conf_type_id → struct_conf_type: soft reference, no FK enforced
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='Helices and turns. conf_type_id soft-ref struct_conf_type. Parent: entry.';


-- T5-03  struct_sheet  ────────────────────────────────────────
-- Beta-sheet parent record. Children: order, range, hbond.
-- PK=(id, entry_id) because sheet 'A','B' repeats across entries.
CREATE TABLE IF NOT EXISTS struct_sheet (
    id             VARCHAR(20) NOT NULL,
    entry_id       VARCHAR(20) NOT NULL,
    type           VARCHAR(50),
    number_strands INT,
    details        TEXT,
    PRIMARY KEY (id, entry_id),
    KEY idx_ss_entry (entry_id),
    CONSTRAINT fk_ss_entry
        FOREIGN KEY (entry_id) REFERENCES entry(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='Beta-sheet parent. PK=(id,entry_id). Parent: entry.';


-- T5-04  struct_sheet_order  ──────────────────────────────────
-- Strand pair ordering and parallel/antiparallel sense.
-- FK: (sheet_id, entry_id) → struct_sheet(id, entry_id)
CREATE TABLE IF NOT EXISTS struct_sheet_order (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    sheet_id   VARCHAR(20)  NOT NULL,
    entry_id   VARCHAR(20)  NOT NULL,
    range_id_1 VARCHAR(10),
    range_id_2 VARCHAR(10),
    offset     VARCHAR(20),
    sense      VARCHAR(20),
    PRIMARY KEY (id),
    KEY idx_sso_entry (entry_id),
    KEY idx_sso_sheet (sheet_id, entry_id),
    CONSTRAINT fk_sso_entry
        FOREIGN KEY (entry_id) REFERENCES entry(id) ON DELETE CASCADE,
    CONSTRAINT fk_sso_sheet
        FOREIGN KEY (sheet_id, entry_id)
        REFERENCES struct_sheet(id, entry_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='Strand pair order + sense. Parent: struct_sheet(id,entry_id).';


-- T5-05  struct_sheet_range  ──────────────────────────────────
-- Start/end residue of each beta-strand (label + auth numbering).
-- FK: (sheet_id, entry_id) → struct_sheet(id, entry_id)
-- PK is 3-column composite: (id, sheet_id, entry_id)
CREATE TABLE IF NOT EXISTS struct_sheet_range (
    id                    VARCHAR(20) NOT NULL,
    sheet_id              VARCHAR(20) NOT NULL,
    entry_id              VARCHAR(20) NOT NULL,
    beg_label_comp_id     VARCHAR(10),
    beg_label_asym_id     VARCHAR(20),
    beg_label_seq_id      INT,
    pdbx_beg_PDB_ins_code VARCHAR(5),
    end_label_comp_id     VARCHAR(10),
    end_label_asym_id     VARCHAR(20),
    end_label_seq_id      INT,
    pdbx_end_PDB_ins_code VARCHAR(5),
    beg_auth_comp_id      VARCHAR(10),
    beg_auth_asym_id      VARCHAR(10),
    beg_auth_seq_id       VARCHAR(20),
    end_auth_comp_id      VARCHAR(10),
    end_auth_asym_id      VARCHAR(10),
    end_auth_seq_id       VARCHAR(20),
    PRIMARY KEY (id, sheet_id, entry_id),
    KEY idx_ssr_entry (entry_id),
    KEY idx_ssr_sheet (sheet_id, entry_id),
    CONSTRAINT fk_ssr_entry
        FOREIGN KEY (entry_id) REFERENCES entry(id) ON DELETE CASCADE,
    CONSTRAINT fk_ssr_sheet
        FOREIGN KEY (sheet_id, entry_id)
        REFERENCES struct_sheet(id, entry_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='Beta-strand residue ranges. Parent: struct_sheet(id,entry_id).';


-- T5-06  pdbx_struct_sheet_hbond  ────────────────────────────
-- Inter-strand H-bonds within a beta-sheet.
-- FK: (sheet_id, entry_id) → struct_sheet(id, entry_id)
CREATE TABLE IF NOT EXISTS pdbx_struct_sheet_hbond (
    id                    INT UNSIGNED NOT NULL AUTO_INCREMENT,
    sheet_id              VARCHAR(20)  NOT NULL,
    entry_id              VARCHAR(20)  NOT NULL,
    range_id_1            VARCHAR(10),
    range_id_2            VARCHAR(10),
    range_1_label_atom_id VARCHAR(20),
    range_1_label_comp_id VARCHAR(10),
    range_1_label_asym_id VARCHAR(20),
    range_1_label_seq_id  INT,
    range_1_PDB_ins_code  VARCHAR(5),
    range_1_auth_atom_id  VARCHAR(20),
    range_1_auth_comp_id  VARCHAR(10),
    range_1_auth_asym_id  VARCHAR(10),
    range_1_auth_seq_id   VARCHAR(20),
    range_2_label_atom_id VARCHAR(20),
    range_2_label_comp_id VARCHAR(10),
    range_2_label_asym_id VARCHAR(20),
    range_2_label_seq_id  INT,
    range_2_PDB_ins_code  VARCHAR(5),
    range_2_auth_atom_id  VARCHAR(20),
    range_2_auth_comp_id  VARCHAR(10),
    range_2_auth_asym_id  VARCHAR(10),
    range_2_auth_seq_id   VARCHAR(20),
    PRIMARY KEY (id),
    KEY idx_hb_entry (entry_id),
    KEY idx_hb_sheet (sheet_id, entry_id),
    CONSTRAINT fk_hb_entry
        FOREIGN KEY (entry_id) REFERENCES entry(id) ON DELETE CASCADE,
    CONSTRAINT fk_hb_sheet
        FOREIGN KEY (sheet_id, entry_id)
        REFERENCES struct_sheet(id, entry_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='Sheet inter-strand H-bonds. Parent: struct_sheet(id,entry_id).';


-- ============================================================
--  TIER 6 — CRYSTALLOGRAPHY & REFINEMENT
-- ============================================================

-- T6-01  exptl  ───────────────────────────────────────────────
-- Experimental method: X-RAY DIFFRACTION, SOLUTION NMR, etc.
-- 1:1 with entry.
CREATE TABLE IF NOT EXISTS exptl (
    entry_id        VARCHAR(20)  NOT NULL,
    method          VARCHAR(100),
    crystals_number INT,
    PRIMARY KEY (entry_id),
    CONSTRAINT fk_exptl_entry
        FOREIGN KEY (entry_id) REFERENCES entry(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='Experimental method. 1:1. Parent: entry.';


-- T6-02  cell  ────────────────────────────────────────────────
-- Unit cell dimensions. 1:1 with entry (NULL for NMR structures).
CREATE TABLE IF NOT EXISTS cell (
    entry_id    VARCHAR(20) NOT NULL,
    length_a    FLOAT,
    length_b    FLOAT,
    length_c    FLOAT,
    angle_alpha FLOAT,
    angle_beta  FLOAT,
    angle_gamma FLOAT,
    Z_PDB       INT,
    PRIMARY KEY (entry_id),
    CONSTRAINT fk_cell_entry
        FOREIGN KEY (entry_id) REFERENCES entry(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='Unit cell dimensions. 1:1. Parent: entry.';


-- T6-03  symmetry  ────────────────────────────────────────────
-- Space group. 1:1 with entry.
-- IMPORTANT: CIF field is _symmetry.space_group_name_H-M  (hyphen!)
-- MySQL column is space_group_name_H_M  (underscore).
-- The loader must look up the hyphen form from sv dict.
CREATE TABLE IF NOT EXISTS symmetry (
    entry_id             VARCHAR(20) NOT NULL,
    space_group_name_H_M VARCHAR(50),   -- CIF: H-M (hyphen) → SQL: H_M (underscore)
    Int_Tables_number    INT,
    PRIMARY KEY (entry_id),
    CONSTRAINT fk_sym_entry
        FOREIGN KEY (entry_id) REFERENCES entry(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='Space group. CIF H-M (hyphen) stored as H_M (underscore). 1:1. Parent: entry.';


-- T6-04  reflns  ──────────────────────────────────────────────
-- Reflection statistics. 1:1 with entry (NULL for NMR).
CREATE TABLE IF NOT EXISTS reflns (
    entry_id                   VARCHAR(20) NOT NULL,
    observed_criterion_sigma_I FLOAT,
    observed_criterion_sigma_F FLOAT,
    d_resolution_low           FLOAT,
    d_resolution_high          FLOAT,
    number_obs                 INT,
    number_all                 INT,
    percent_possible_obs       FLOAT,
    PRIMARY KEY (entry_id),
    CONSTRAINT fk_reflns_entry
        FOREIGN KEY (entry_id) REFERENCES entry(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='Reflection statistics. 1:1. Parent: entry.';


-- T6-05  diffrn  ──────────────────────────────────────────────
-- Diffraction experiment. 1:N (some entries have multiple runs).
-- PK=(id, entry_id) because id='1' repeats across entries.
CREATE TABLE IF NOT EXISTS diffrn (
    id           VARCHAR(20) NOT NULL,
    entry_id     VARCHAR(20) NOT NULL,
    ambient_temp FLOAT,
    PRIMARY KEY (id, entry_id),
    KEY idx_diffrn_entry (entry_id),
    CONSTRAINT fk_diffrn_entry
        FOREIGN KEY (entry_id) REFERENCES entry(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='Diffraction experiment(s). PK=(id,entry_id). 1:N. Parent: entry.';


-- T6-06  refine  ──────────────────────────────────────────────
-- Refinement statistics. 1:1 with entry (NULL for NMR).
-- All fields from professor's cif_categories txt retained.
CREATE TABLE IF NOT EXISTS refine (
    entry_id                        VARCHAR(20)  NOT NULL,
    pdbx_refine_id                  VARCHAR(50),
    ls_number_reflns_obs            INT,
    ls_number_reflns_all            INT,
    pdbx_ls_sigma_I                 FLOAT,
    pdbx_ls_sigma_F                 FLOAT,
    ls_d_res_low                    FLOAT,
    ls_d_res_high                   FLOAT,
    ls_percent_reflns_obs           FLOAT,
    ls_R_factor_obs                 FLOAT,
    ls_R_factor_all                 FLOAT,
    ls_R_factor_R_work              FLOAT,
    ls_R_factor_R_free              FLOAT,
    ls_percent_reflns_R_free        FLOAT,
    ls_number_reflns_R_free         INT,
    solvent_model_details           VARCHAR(255),
    pdbx_solvent_vdw_probe_radii    FLOAT,
    pdbx_solvent_shrinkage_radii    FLOAT,
    pdbx_starting_model             VARCHAR(255),
    pdbx_method_to_determine_struct VARCHAR(100),
    pdbx_stereochemistry_target_values VARCHAR(50),
    pdbx_R_Free_selection_details   VARCHAR(50),
    overall_SU_ML                   FLOAT,
    pdbx_overall_phase_error        FLOAT,
    pdbx_diffrn_id                  VARCHAR(20),
    PRIMARY KEY (entry_id),
    CONSTRAINT fk_refine_entry
        FOREIGN KEY (entry_id) REFERENCES entry(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='Refinement statistics. 1:1. Parent: entry.';



-- ============================================================
--  TIER 7 — CHEMISTRY
-- ============================================================

-- T7-01  chem_comp  ───────────────────────────────────────────
-- Shared chemical component dictionary.
-- NO entry_id — one global vocabulary (DA, DG, HOH, MG, …)
-- used by many structures. INSERT IGNORE is essential.
-- comp_id in pdbx_entity_nonpoly soft-references this table.
CREATE TABLE IF NOT EXISTS chem_comp (
    id             VARCHAR(10)  NOT NULL,
    type           VARCHAR(100),
    mon_nstd_flag  VARCHAR(5),
    name           TEXT,
    pdbx_synonyms  TEXT,
    formula        VARCHAR(255),
    formula_weight FLOAT,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='Chemical component dictionary. Shared, no entry_id. INSERT IGNORE.';


-- ============================================================
--  TIER 8 — NtC RNA ANNOTATIONS
-- ============================================================

-- T8-01  ndb_struct_ntc_overall  ──────────────────────────────
-- One summary row per entry: CONFAL score, step counts, versions.
-- CIF form: single-value (not loop_).
-- 1:1 with entry.
CREATE TABLE IF NOT EXISTS ndb_struct_ntc_overall (
    entry_id                    VARCHAR(20) NOT NULL,
    confal_score                FLOAT,
    confal_percentile           INT,
    ntc_version                 VARCHAR(20),
    cana_version                VARCHAR(20),
    num_steps                   INT,
    num_classified              INT,
    num_unclassified            INT,
    num_unclassified_rmsd_close INT,
    PRIMARY KEY (entry_id),
    CONSTRAINT fk_ntco_entry
        FOREIGN KEY (entry_id) REFERENCES entry(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='NtC overall stats. 1:1. CIF single-value form. Parent: entry.';


-- T8-02  ndb_struct_ntc_step  ─────────────────────────────────
-- One row per dinucleotide step (two consecutive nucleotides).
-- PARENT of step_summary, step_parameters, sugar_step_parameters.
-- PK=(id, entry_id).  id is an integer step counter (1,2,3…)
-- NOTE: CIF loop_ does NOT include entry_id — loader injects it.
CREATE TABLE IF NOT EXISTS ndb_struct_ntc_step (
    id                INT         NOT NULL,
    entry_id          VARCHAR(20) NOT NULL,
    name              VARCHAR(100),
    PDB_model_number  INT,
    label_entity_id_1 VARCHAR(20),
    label_asym_id_1   VARCHAR(20),
    label_seq_id_1    INT,
    label_comp_id_1   VARCHAR(10),
    label_alt_id_1    VARCHAR(5),
    label_entity_id_2 VARCHAR(20),
    label_asym_id_2   VARCHAR(20),
    label_seq_id_2    INT,
    label_comp_id_2   VARCHAR(10),
    label_alt_id_2    VARCHAR(5),
    auth_asym_id_1    VARCHAR(10),
    auth_seq_id_1     VARCHAR(20),
    auth_asym_id_2    VARCHAR(10),
    auth_seq_id_2     VARCHAR(20),
    PDB_ins_code_1    VARCHAR(5),
    PDB_ins_code_2    VARCHAR(5),
    PRIMARY KEY (id, entry_id),
    KEY idx_ntcs_entry (entry_id),
    CONSTRAINT fk_ntcs_entry
        FOREIGN KEY (entry_id) REFERENCES entry(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='Dinucleotide steps. PK=(id,entry_id). PARENT of 3 NtC children. entry_id injected by loader.';


-- T8-03  ndb_struct_ntc_step_summary  ─────────────────────────
-- NtC class, CANA assignment, CONFAL score per step.
-- 1:1 with ndb_struct_ntc_step.
-- NOTE: CIF loop_ does NOT include entry_id — loader injects it.
CREATE TABLE IF NOT EXISTS ndb_struct_ntc_step_summary (
    step_id                                   INT         NOT NULL,
    entry_id                                  VARCHAR(20) NOT NULL,
    assigned_CANA                             VARCHAR(10),
    assigned_NtC                              VARCHAR(10),
    confal_score                              FLOAT,
    euclidean_distance_NtC_ideal              FLOAT,
    cartesian_rmsd_closest_NtC_representative FLOAT,
    closest_CANA                              VARCHAR(10),
    closest_NtC                               VARCHAR(10),
    closest_step_golden                       VARCHAR(100),
    PRIMARY KEY (step_id, entry_id),
    KEY idx_ntcss_entry (entry_id),
    CONSTRAINT fk_ntcss_entry
        FOREIGN KEY (entry_id) REFERENCES entry(id) ON DELETE CASCADE,
    CONSTRAINT fk_ntcss_step
        FOREIGN KEY (step_id, entry_id)
        REFERENCES ndb_struct_ntc_step(id, entry_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='NtC assignment + CONFAL per step. entry_id injected by loader.';


-- T8-04  ndb_struct_ntc_step_parameters  ─────────────────────
-- Full torsion angle suite for each step (37 float columns + details).
-- 1:1 with ndb_struct_ntc_step.
-- NOTE: CIF loop_ does NOT include entry_id — loader injects it.
CREATE TABLE IF NOT EXISTS ndb_struct_ntc_step_parameters (
    step_id              INT         NOT NULL,
    entry_id             VARCHAR(20) NOT NULL,
    tor_delta_1          FLOAT,
    tor_epsilon_1        FLOAT,
    tor_zeta_1           FLOAT,
    tor_alpha_2          FLOAT,
    tor_beta_2           FLOAT,
    tor_gamma_2          FLOAT,
    tor_delta_2          FLOAT,
    tor_chi_1            FLOAT,
    tor_chi_2            FLOAT,
    dist_NN              FLOAT,
    dist_CC              FLOAT,
    tor_NCCN             FLOAT,
    diff_tor_delta_1     FLOAT,
    diff_tor_epsilon_1   FLOAT,
    diff_tor_zeta_1      FLOAT,
    diff_tor_alpha_2     FLOAT,
    diff_tor_beta_2      FLOAT,
    diff_tor_gamma_2     FLOAT,
    diff_tor_delta_2     FLOAT,
    diff_tor_chi_1       FLOAT,
    diff_tor_chi_2       FLOAT,
    diff_dist_NN         FLOAT,
    diff_dist_CC         FLOAT,
    diff_tor_NCCN        FLOAT,
    confal_tor_delta_1   FLOAT,
    confal_tor_epsilon_1 FLOAT,
    confal_tor_zeta_1    FLOAT,
    confal_tor_alpha_2   FLOAT,
    confal_tor_beta_2    FLOAT,
    confal_tor_gamma_2   FLOAT,
    confal_tor_delta_2   FLOAT,
    confal_tor_chi_1     FLOAT,
    confal_tor_chi_2     FLOAT,
    confal_dist_NN       FLOAT,
    confal_dist_CC       FLOAT,
    confal_tor_NCCN      FLOAT,
    details              TEXT,
    PRIMARY KEY (step_id, entry_id),
    KEY idx_ntcsp_entry (entry_id),
    CONSTRAINT fk_ntcsp_entry
        FOREIGN KEY (entry_id) REFERENCES entry(id) ON DELETE CASCADE,
    CONSTRAINT fk_ntcsp_step
        FOREIGN KEY (step_id, entry_id)
        REFERENCES ndb_struct_ntc_step(id, entry_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='Torsion suite per step (37 floats). entry_id injected by loader.';


-- T8-05  ndb_struct_sugar_step_parameters  ────────────────────
-- Ribose pucker phase (P), amplitude (tau), pucker name (Pn),
-- and nu angles (nu0-nu4) for both nucleotides in each step.
-- 1:1 with ndb_struct_ntc_step.
-- NOTE: CIF loop_ does NOT include entry_id — loader injects it.
CREATE TABLE IF NOT EXISTS ndb_struct_sugar_step_parameters (
    step_id     INT         NOT NULL,
    entry_id    VARCHAR(20) NOT NULL,
    P_1         FLOAT,
    tau_1       FLOAT,
    Pn_1        VARCHAR(10),
    P_2         FLOAT,
    tau_2       FLOAT,
    Pn_2        VARCHAR(10),
    nu_1_1      FLOAT,
    nu_1_2      FLOAT,
    nu_1_3      FLOAT,
    nu_1_4      FLOAT,
    nu_1_5      FLOAT,
    nu_2_1      FLOAT,
    nu_2_2      FLOAT,
    nu_2_3      FLOAT,
    nu_2_4      FLOAT,
    nu_2_5      FLOAT,
    diff_nu_1_1 FLOAT,
    diff_nu_1_2 FLOAT,
    diff_nu_1_3 FLOAT,
    diff_nu_1_4 FLOAT,
    diff_nu_1_5 FLOAT,
    diff_nu_2_1 FLOAT,
    diff_nu_2_2 FLOAT,
    diff_nu_2_3 FLOAT,
    diff_nu_2_4 FLOAT,
    diff_nu_2_5 FLOAT,
    PRIMARY KEY (step_id, entry_id),
    KEY idx_sugar_entry (entry_id),
    CONSTRAINT fk_sugar_entry
        FOREIGN KEY (entry_id) REFERENCES entry(id) ON DELETE CASCADE,
    CONSTRAINT fk_sugar_step
        FOREIGN KEY (step_id, entry_id)
        REFERENCES ndb_struct_ntc_step(id, entry_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='Ribose pucker + nu angles per step. entry_id injected by loader.';


-- T8-06  ndb_base_pair_list  ──────────────────────────────────
-- All base pairs in the structure (Watson-Crick + non-canonical).
-- PK=(base_pair_id, entry_id).
-- PARENT of ndb_base_pair_annotation.
-- NOTE: CIF loop_ does NOT include entry_id — loader injects it.
CREATE TABLE IF NOT EXISTS ndb_base_pair_list (
    base_pair_id     INT         NOT NULL,
    entry_id         VARCHAR(20) NOT NULL,
    PDB_model_number INT,
    asym_id_1        VARCHAR(20),
    entity_id_1      VARCHAR(20),
    seq_id_1         INT,
    comp_id_1        VARCHAR(10),
    PDB_ins_code_1   VARCHAR(5),
    alt_id_1         VARCHAR(5),
    struct_oper_id_1 VARCHAR(20),
    asym_id_2        VARCHAR(20),
    entity_id_2      VARCHAR(20),
    seq_id_2         INT,
    comp_id_2        VARCHAR(10),
    PDB_ins_code_2   VARCHAR(5),
    alt_id_2         VARCHAR(5),
    struct_oper_id_2 VARCHAR(20),
    auth_asym_id_1   VARCHAR(10),
    auth_seq_id_1    VARCHAR(20),
    auth_asym_id_2   VARCHAR(10),
    auth_seq_id_2    VARCHAR(20),
    PRIMARY KEY (base_pair_id, entry_id),
    KEY idx_bpl_entry (entry_id),
    CONSTRAINT fk_bpl_entry
        FOREIGN KEY (entry_id) REFERENCES entry(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='Base pair list (WC + non-canonical). entry_id injected by loader.';


-- T8-07  ndb_base_pair_annotation  ────────────────────────────
-- Leontis-Westhof (LW) annotation for each base pair.
-- CIF columns l-w_family_num and l-w_family use literal hyphens.
-- MySQL columns:  lw_family_num, lw_family  (hyphens → removed).
-- Loader explicitly maps the hyphenated CIF key to the clean column.
-- PARENT: ndb_base_pair_list via (base_pair_id, entry_id).
-- NOTE: CIF loop_ does NOT include entry_id — loader injects it.
CREATE TABLE IF NOT EXISTS ndb_base_pair_annotation (
    id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
    base_pair_id  INT          NOT NULL,
    entry_id      VARCHAR(20)  NOT NULL,
    orientation   VARCHAR(20),
    base_1_edge   VARCHAR(50),
    base_2_edge   VARCHAR(50),
    lw_family_num INT,           -- CIF: l-w_family_num  (hyphen removed)
    lw_family     VARCHAR(10),   -- CIF: l-w_family      (hyphen removed)
    class         VARCHAR(30),
    subclass      VARCHAR(50),
    PRIMARY KEY (id),
    KEY idx_bpa_entry (entry_id),
    KEY idx_bpa_pair  (base_pair_id, entry_id),
    CONSTRAINT fk_bpa_entry
        FOREIGN KEY (entry_id) REFERENCES entry(id) ON DELETE CASCADE,
    CONSTRAINT fk_bpa_pair
        FOREIGN KEY (base_pair_id, entry_id)
        REFERENCES ndb_base_pair_list(base_pair_id, entry_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='LW annotation (cWW, cWH…). CIF l-w_family→lw_family. entry_id injected by loader.';



-- T9-01  pdbx_validate_rmsd_bond  ─────────────────────────────
-- Bond length RMSD outliers. One row per outlier bond.
-- Identifies bonds whose length deviates from ideal geometry.
-- CIF loop has no entry_id — loader injects it.
-- CIF 'id' column is ignored; AUTO_INCREMENT gives global unique id.
CREATE TABLE IF NOT EXISTS pdbx_validate_rmsd_bond (
    id                      INT UNSIGNED NOT NULL AUTO_INCREMENT,
    entry_id                VARCHAR(20)  NOT NULL,
    PDB_model_num           INT,
    auth_atom_id_1          VARCHAR(20),
    auth_asym_id_1          VARCHAR(10),
    auth_comp_id_1          VARCHAR(10),
    auth_seq_id_1           VARCHAR(20),
    PDB_ins_code_1          VARCHAR(5),
    label_alt_id_1          VARCHAR(5),
    auth_atom_id_2          VARCHAR(20),
    auth_asym_id_2          VARCHAR(10),
    auth_comp_id_2          VARCHAR(10),
    auth_seq_id_2           VARCHAR(20),
    PDB_ins_code_2          VARCHAR(5),
    label_alt_id_2          VARCHAR(5),
    bond_value              FLOAT,
    bond_target_value       FLOAT,
    bond_deviation          FLOAT,
    bond_standard_deviation FLOAT,
    linker_flag             VARCHAR(5),
    PRIMARY KEY (id),
    KEY idx_vrb_entry (entry_id),
    CONSTRAINT fk_vrb_entry
        FOREIGN KEY (entry_id) REFERENCES entry(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='Bond RMSD outliers. entry_id injected by loader. CIF id ignored (AUTO_INCREMENT).';


-- T9-02  pdbx_validate_rmsd_angle  ────────────────────────────
-- Bond angle RMSD outliers. One row per outlier angle (3 atoms).
-- CIF loop has no entry_id — loader injects it.
-- CIF 'id' column is ignored; AUTO_INCREMENT gives global unique id.
CREATE TABLE IF NOT EXISTS pdbx_validate_rmsd_angle (
    id                       INT UNSIGNED NOT NULL AUTO_INCREMENT,
    entry_id                 VARCHAR(20)  NOT NULL,
    PDB_model_num            INT,
    auth_atom_id_1           VARCHAR(20),
    auth_asym_id_1           VARCHAR(10),
    auth_comp_id_1           VARCHAR(10),
    auth_seq_id_1            VARCHAR(20),
    PDB_ins_code_1           VARCHAR(5),
    label_alt_id_1           VARCHAR(5),
    auth_atom_id_2           VARCHAR(20),
    auth_asym_id_2           VARCHAR(10),
    auth_comp_id_2           VARCHAR(10),
    auth_seq_id_2            VARCHAR(20),
    PDB_ins_code_2           VARCHAR(5),
    label_alt_id_2           VARCHAR(5),
    auth_atom_id_3           VARCHAR(20),
    auth_asym_id_3           VARCHAR(10),
    auth_comp_id_3           VARCHAR(10),
    auth_seq_id_3            VARCHAR(20),
    PDB_ins_code_3           VARCHAR(5),
    label_alt_id_3           VARCHAR(5),
    angle_value              FLOAT,
    angle_target_value       FLOAT,
    angle_deviation          FLOAT,
    angle_standard_deviation FLOAT,
    linker_flag              VARCHAR(5),
    PRIMARY KEY (id),
    KEY idx_vra_entry (entry_id),
    CONSTRAINT fk_vra_entry
        FOREIGN KEY (entry_id) REFERENCES entry(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='Angle RMSD outliers. entry_id injected by loader. CIF id ignored (AUTO_INCREMENT).';


SET FOREIGN_KEY_CHECKS = 1;
