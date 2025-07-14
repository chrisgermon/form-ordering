-- Drop the function if it already exists to ensure a clean setup
DROP FUNCTION IF EXISTS slugify(text);

CREATE OR REPLACE FUNCTION slugify(
  v_text text
)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  -- 1. Replace apostrophes with nothing
  v_text := replace(v_text, '''', '');

  -- 2. Replace non-alphanumeric characters with a hyphen
  v_text := regexp_replace(v_text, '[^a-zA-Z0-9]+', '-', 'g');

  -- 3. Trim leading and trailing hyphens
  v_text := trim(both '-' from v_text);

  -- 4. Convert to lowercase
  v_text := lower(v_text);

  RETURN v_text;
END;
$$;
