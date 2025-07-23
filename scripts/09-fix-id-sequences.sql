-- This script is for PostgreSQL. It finds all tables with a UUID primary key
-- and ensures the default value uses gen_random_uuid().

DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN
        SELECT
            tc.table_schema,
            tc.table_name,
            kc.column_name
        FROM
            information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kc
              ON tc.constraint_name = kc.constraint_name
              AND tc.table_schema = kc.table_schema
        WHERE
            tc.constraint_type = 'PRIMARY KEY'
            AND (SELECT data_type FROM information_schema.columns
                 WHERE table_name = tc.table_name AND column_name = kc.column_name) = 'uuid'
    LOOP
        RAISE NOTICE 'Updating default for %.% column %', rec.table_schema, rec.table_name, rec.column_name;
        EXECUTE format('ALTER TABLE %I.%I ALTER COLUMN %I SET DEFAULT gen_random_uuid()',
                       rec.table_schema, rec.table_name, rec.column_name);
    END LOOP;
END;
$$;
