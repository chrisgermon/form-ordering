-- V0 DIAGNOSTIC SCRIPT
-- This script does NOT modify any data. It only runs checks to help find
-- potential data integrity issues that could cause rendering errors.

-- Run this script in your Supabase SQL Editor and check the results.

-- 1. Check for clinic locations with missing or empty names.
-- A location without a name can cause problems when creating dropdowns.
-- EXPECTED RESULT: 0 rows.
SELECT
  id,
  brand_id,
  name,
  address
FROM
  clinic_locations
WHERE
  name IS NULL OR name = '';

-- 2. Check for active brands that have NO clinic locations.
-- A form for a brand with no locations to select from might be an issue.
-- EXPECTED RESULT: 0 rows.
SELECT
  b.id,
  b.name,
  b.slug
FROM
  brands b
  LEFT JOIN clinic_locations cl ON b.id = cl.brand_id
WHERE
  b.active = TRUE
GROUP BY
  b.id
HAVING
  COUNT(cl.id) = 0;

-- 3. Check for active brands that have NO sections.
-- A form for a brand with no sections will be empty.
-- EXPECTED RESULT: 0 rows.
SELECT
  b.id,
  b.name,
  b.slug
FROM
  brands b
  LEFT JOIN sections s ON b.id = s.brand_id
WHERE
  b.active = TRUE
GROUP BY
  b.id
HAVING
  COUNT(s.id) = 0;

-- 4. Check for sections that contain NO items.
-- An empty section might be unexpected and could indicate an import issue.
-- EXPECTED RESULT: This may return rows, which could be intentional.
-- But if you expect all sections to have items, this can identify problems.
SELECT
  s.id,
  s.title,
  s.brand_id
FROM
  sections s
  LEFT JOIN items i ON s.id = i.section_id
GROUP BY
  s.id
HAVING
  COUNT(i.id) = 0;

-- 5. Check the actual data types and structure of clinic_locations
SELECT 
  id,
  name,
  address,
  pg_typeof(name) as name_type,
  pg_typeof(address) as address_type,
  length(name) as name_length,
  length(address) as address_length
FROM clinic_locations
LIMIT 5;

-- 6. Check for any unusual characters or data in location names/addresses
SELECT 
  id,
  name,
  address,
  ascii(substring(name, 1, 1)) as first_char_ascii,
  ascii(substring(address, 1, 1)) as address_first_char_ascii
FROM clinic_locations
WHERE 
  name ~ '[^\x20-\x7E]' OR  -- Non-printable characters
  address ~ '[^\x20-\x7E]'
LIMIT 10;

-- End of diagnostic script.
