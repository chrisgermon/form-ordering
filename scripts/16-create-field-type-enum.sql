DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'field_type') THEN
        CREATE TYPE field_type AS ENUM (
            'text',
            'textarea',
            'select',
            'radio',
            'checkbox',
            'date',
            'number'
        );
    END IF;
END
$$;
