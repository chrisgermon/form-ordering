CREATE OR REPLACE FUNCTION slugify(text)
RETURNS text AS $$
    -- removes accents (diacritic signs) from a given string --
    WITH "unaccented" AS (
      SELECT unaccent("text") AS "text"
    ),
    -- lowercases the string
    "lowercase" AS (
      SELECT lower("text") AS "text"
      FROM "unaccented"
    ),
    -- remove single and double quotes
    "removed_quotes" AS (
      SELECT regexp_replace("text", '[''"]+', '', 'gi') AS "text"
      FROM "lowercase"
    ),
    -- replaces anything that's not a letter, number, hyphen, or underscore with a hyphen
    "hyphenated" AS (
      SELECT regexp_replace("text", '[^a-z0-9\\-_]+', '-', 'gi') AS "text"
      FROM "removed_quotes"
    ),
    -- trims hyphens from the beginning and end of the string
    "trimmed" AS (
      SELECT regexp_replace(regexp_replace("text", '^-+', ''), '-+$', '') AS "text"
      FROM "hyphenated"
    )
    SELECT "text" FROM "trimmed";
$$ LANGUAGE SQL IMMUTABLE;
