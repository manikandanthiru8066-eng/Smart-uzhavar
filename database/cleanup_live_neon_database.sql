-- ============================================================================
-- SMART UZHAVAR: PRODUCTION DATABASE CLEANUP & DEDUPLICATION SCRIPT
-- Database: PostgreSQL (Neon / Render Live Database)
-- Purpose: Safely merges duplicate records, re-links foreign keys,
--          and enforces unique constraints across all seeded tables.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- STEP 1: STANDARDIZE MISSPELLED DISTRICT NAMES
-- ----------------------------------------------------------------------------
-- Update known variant spellings to canonical Tamil Nadu district names
UPDATE districts SET name = 'Thoothukudi' WHERE name ILIKE 'Thoothukkudi' OR name ILIKE 'tuticorin';
UPDATE districts SET name = 'Kanchipuram' WHERE name ILIKE 'Kancheepuram';
UPDATE districts SET name = 'Kanyakumari' WHERE name ILIKE 'Kanniyakumari' OR name ILIKE 'kanya kumari';
UPDATE districts SET name = 'Nilgiris' WHERE name ILIKE 'The Nilgiris' OR name ILIKE 'the nilgiri' OR name ILIKE 'nilgiri';
UPDATE districts SET name = 'Tiruvallur' WHERE name ILIKE 'Thiruvallur';
UPDATE districts SET name = 'Tiruvarur' WHERE name ILIKE 'Thiruvarur';
UPDATE districts SET name = 'Tiruchirappalli' WHERE name ILIKE 'trichy' OR name ILIKE 'tiruchy';
UPDATE districts SET name = 'Tirupathur' WHERE name ILIKE 'tirupattur';
UPDATE districts SET name = 'Viluppuram' WHERE name ILIKE 'villupuram';
UPDATE districts SET name = 'Sivaganga' WHERE name ILIKE 'sivagangai';

-- ----------------------------------------------------------------------------
-- STEP 2: DEDUPLICATE DISTRICTS TABLE & RE-LINK ALL FOREIGN KEYS
-- ----------------------------------------------------------------------------
-- Create temporary mapping of duplicate district IDs to their canonical minimum ID
CREATE TEMP TABLE tmp_district_map AS
SELECT d.id AS duplicate_id, c.canonical_id
FROM districts d
JOIN (
    SELECT LOWER(name) AS norm_name, MIN(id) AS canonical_id
    FROM districts
    GROUP BY LOWER(name)
) c ON LOWER(d.name) = c.norm_name
WHERE d.id <> c.canonical_id;

-- Re-link foreign keys referencing duplicate districts
UPDATE taluks t
SET district_id = m.canonical_id
FROM tmp_district_map m
WHERE t.district_id = m.duplicate_id;

UPDATE district_crop_stats s
SET district_id = m.canonical_id
FROM tmp_district_map m
WHERE s.district_id = m.duplicate_id;

UPDATE farmer_profiles p
SET district_id = m.canonical_id
FROM tmp_district_map m
WHERE p.district_id = m.duplicate_id;

-- Delete duplicate district rows
DELETE FROM districts d
USING tmp_district_map m
WHERE d.id = m.duplicate_id;

DROP TABLE tmp_district_map;

-- Add UNIQUE index on lowercase district name if not present
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'idx_districts_lower_name' AND n.nspname = 'public'
    ) THEN
        CREATE UNIQUE INDEX idx_districts_lower_name ON districts (LOWER(name));
    END IF;
END $$;


-- ----------------------------------------------------------------------------
-- STEP 3: DEDUPLICATE TALUKS TABLE & RE-LINK FOREIGN KEYS
-- ----------------------------------------------------------------------------
-- Standardize taluk names
UPDATE taluks SET name = 'Thoothukudi' WHERE name ILIKE 'Thoothukkudi';
UPDATE taluks SET name = 'Kanchipuram' WHERE name ILIKE 'Kancheepuram';
UPDATE taluks SET name = 'Tiruvallur' WHERE name ILIKE 'Thiruvallur';
UPDATE taluks SET name = 'Tiruvarur' WHERE name ILIKE 'Thiruvarur';

-- Create mapping for duplicate taluks
CREATE TEMP TABLE tmp_taluk_map AS
SELECT t.id AS duplicate_id, c.canonical_id
FROM taluks t
JOIN (
    SELECT district_id, LOWER(name) AS norm_name, MIN(id) AS canonical_id
    FROM taluks
    GROUP BY district_id, LOWER(name)
) c ON t.district_id = c.district_id AND LOWER(t.name) = c.norm_name
WHERE t.id <> c.canonical_id;

-- Re-link taluk references
UPDATE farmer_profiles p
SET taluk_id = m.canonical_id
FROM tmp_taluk_map m
WHERE p.taluk_id = m.duplicate_id;

UPDATE taluk_blocks tb
SET taluk_id = m.canonical_id
FROM tmp_taluk_map m
WHERE tb.taluk_id = m.duplicate_id;

-- Delete duplicate taluks
DELETE FROM taluks t
USING tmp_taluk_map m
WHERE t.id = m.duplicate_id;

DROP TABLE tmp_taluk_map;


-- ----------------------------------------------------------------------------
-- STEP 4: DEDUPLICATE BLOCKS TABLE & RE-LINK FOREIGN KEYS
-- ----------------------------------------------------------------------------
UPDATE blocks SET name = 'Thoothukudi' WHERE name ILIKE 'Thoothukkudi';

CREATE TEMP TABLE tmp_block_map AS
SELECT b.id AS duplicate_id, c.canonical_id
FROM blocks b
JOIN (
    SELECT lgd_block_code, MIN(id) AS canonical_id
    FROM blocks
    GROUP BY lgd_block_code
) c ON b.lgd_block_code = c.lgd_block_code
WHERE b.id <> c.canonical_id;

UPDATE farmer_profiles p
SET block_id = m.canonical_id
FROM tmp_block_map m
WHERE p.block_id = m.duplicate_id;

UPDATE taluk_blocks tb
SET block_id = m.canonical_id
FROM tmp_block_map m
WHERE tb.block_id = m.duplicate_id;

DELETE FROM blocks b
USING tmp_block_map m
WHERE b.id = m.duplicate_id;

DROP TABLE tmp_block_map;

-- Deduplicate join table taluk_blocks
DELETE FROM taluk_blocks a
USING taluk_blocks b
WHERE a.ctid < b.ctid
  AND a.taluk_id = b.taluk_id
  AND a.block_id = b.block_id;


-- ----------------------------------------------------------------------------
-- STEP 5: DEDUPLICATE SUBSIDY SCHEMES TABLE & RE-LINK APPLICATIONS
-- ----------------------------------------------------------------------------
CREATE TEMP TABLE tmp_subsidy_map AS
SELECT s.id AS duplicate_id, c.canonical_id
FROM subsidy_schemes s
JOIN (
    SELECT LOWER(name) AS norm_name, MIN(id) AS canonical_id
    FROM subsidy_schemes
    GROUP BY LOWER(name)
) c ON LOWER(s.name) = c.norm_name
WHERE s.id <> c.canonical_id;

UPDATE subsidy_applications a
SET scheme_id = m.canonical_id
FROM tmp_subsidy_map m
WHERE a.scheme_id = m.duplicate_id;

DELETE FROM subsidy_schemes s
USING tmp_subsidy_map m
WHERE s.id = m.duplicate_id;

DROP TABLE tmp_subsidy_map;

-- Ensure UNIQUE index on subsidy_schemes name
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'idx_subsidy_schemes_lower_name' AND n.nspname = 'public'
    ) THEN
        CREATE UNIQUE INDEX idx_subsidy_schemes_lower_name ON subsidy_schemes (LOWER(name));
    END IF;
END $$;


-- ----------------------------------------------------------------------------
-- STEP 6: DEDUPLICATE INSURANCE SCHEMES TABLE & RE-LINK ESTIMATES
-- ----------------------------------------------------------------------------
CREATE TEMP TABLE tmp_insurance_map AS
SELECT s.id AS duplicate_id, c.canonical_id
FROM insurance_schemes s
JOIN (
    SELECT LOWER(name) AS norm_name, MIN(id) AS canonical_id
    FROM insurance_schemes
    GROUP BY LOWER(name)
) c ON LOWER(s.name) = c.norm_name
WHERE s.id <> c.canonical_id;

UPDATE insurance_estimates e
SET scheme_id = m.canonical_id
FROM tmp_insurance_map m
WHERE e.scheme_id = m.duplicate_id;

DELETE FROM insurance_schemes s
USING tmp_insurance_map m
WHERE s.id = m.duplicate_id;

DROP TABLE tmp_insurance_map;

-- Ensure UNIQUE index on insurance_schemes name
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'idx_insurance_schemes_lower_name' AND n.nspname = 'public'
    ) THEN
        CREATE UNIQUE INDEX idx_insurance_schemes_lower_name ON insurance_schemes (LOWER(name));
    END IF;
END $$;


-- ----------------------------------------------------------------------------
-- STEP 7: DEDUPLICATE DISTRICT CROP STATISTICS TABLE
-- ----------------------------------------------------------------------------
DELETE FROM district_crop_stats a
USING district_crop_stats b
WHERE a.id > b.id
  AND a.district_id = b.district_id
  AND LOWER(a.crop) = LOWER(b.crop)
  AND LOWER(a.season) = LOWER(b.season)
  AND a.year = b.year;


-- ----------------------------------------------------------------------------
-- STEP 8: UPDATE TAMIL TRANSLATIONS FOR SCHEMES IF MISSING
-- ----------------------------------------------------------------------------
UPDATE subsidy_schemes SET name_ta = 'பிரதம மந்திரி கிசான் சம்மான் நிதி (PM-KISAN)' WHERE name ILIKE 'PM-KISAN%' AND name_ta IS NULL;
UPDATE subsidy_schemes SET name_ta = 'வேளாண் இயந்திரமயமாக்கல் துணை இயக்கம் (SMAM)' WHERE name ILIKE 'Sub-Mission on Agricultural Mechanization%' AND name_ta IS NULL;
UPDATE subsidy_schemes SET name_ta = 'சொட்டுநீர் பாசன திட்டம் (PMKSY-MI)' WHERE name ILIKE 'Per Drop More Crop%' AND name_ta IS NULL;
UPDATE subsidy_schemes SET name_ta = 'தேசிய உணவு பாதுகாப்பு இயக்கம் (NFSM)' WHERE name ILIKE 'National Food Security Mission%' AND name_ta IS NULL;
UPDATE subsidy_schemes SET name_ta = 'மண் வள அட்டை திட்டம்' WHERE name ILIKE 'Soil Health Card Scheme%' AND name_ta IS NULL;
UPDATE subsidy_schemes SET name_ta = 'ராஷ்ட்ரிய கிருஷி விகாஸ் யோஜனா (RKVY)' WHERE name ILIKE 'Rashtriya Krishi Vikas Yojana%' AND name_ta IS NULL;
UPDATE subsidy_schemes SET name_ta = 'இயற்கை விவசாய மேம்பாட்டு திட்டம் (PKVY)' WHERE name ILIKE 'Paramparagat Krishi Vikas Yojana%' AND name_ta IS NULL;
UPDATE subsidy_schemes SET name_ta = 'கிசான் கடன் அட்டை (KCC)' WHERE name ILIKE 'Kisan Credit Card%' AND name_ta IS NULL;
UPDATE subsidy_schemes SET name_ta = 'தேசிய மூங்கில் இயக்கம்' WHERE name ILIKE 'National Bamboo Mission%' AND name_ta IS NULL;
UPDATE subsidy_schemes SET name_ta = 'மானாவாரி நில மேம்பாட்டு திட்டம் (TNMSDA)' WHERE name ILIKE 'Tamil Nadu Mission on Sustainable Dryland Agriculture%' AND name_ta IS NULL;

UPDATE insurance_schemes SET name_ta = 'பிரதம மந்திரி பயிர் காப்பீட்டுத் திட்டம் (PMFBY) - காரீஃப்' WHERE name ILIKE '%PMFBY%Kharif%' AND name_ta IS NULL;
UPDATE insurance_schemes SET name_ta = 'பிரதம மந்திரி பயிர் காப்பீட்டுத் திட்டம் (PMFBY) - ரபி' WHERE name ILIKE '%PMFBY%Rabi%' AND name_ta IS NULL;
UPDATE insurance_schemes SET name_ta = 'மறுசீரமைக்கப்பட்ட வானிலை அடிப்படையிலான பயிர் காப்பீட்டுத் திட்டம் (RWBCIS)' WHERE name ILIKE '%RWBCIS%' AND name_ta IS NULL;
UPDATE insurance_schemes SET name_ta = 'ஒருங்கிணைந்த தொகுப்பு காப்பீட்டுத் திட்டம் (UPIS)' WHERE name ILIKE '%UPIS%' AND name_ta IS NULL;
UPDATE insurance_schemes SET name_ta = 'தென்னை மர காப்பீட்டுத் திட்டம் (CPIS)' WHERE name ILIKE '%Coconut Palm Insurance%' AND name_ta IS NULL;

COMMIT;

-- ----------------------------------------------------------------------------
-- STEP 9: POST-CLEANUP VERIFICATION QUERIES
-- ----------------------------------------------------------------------------
SELECT 'Districts' AS table_name, count(*) AS actual_count, 38 AS expected_count FROM districts
UNION ALL
SELECT 'Subsidy Schemes', count(*), 10 FROM subsidy_schemes
UNION ALL
SELECT 'Insurance Schemes', count(*), 5 FROM insurance_schemes
UNION ALL
SELECT 'Taluks', count(*), 317 FROM taluks
UNION ALL
SELECT 'Blocks', count(*), (SELECT count(DISTINCT lgd_block_code) FROM blocks) FROM blocks
UNION ALL
SELECT 'Crop Stats', count(*), 40 FROM district_crop_stats;
