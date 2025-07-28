-- This script adds a default admin user with credentials:
-- Email: chris@crowdit.com.au
-- Password: password
-- It's highly recommended to change this password in a production environment.

-- First, delete the old admin users if they exist to avoid conflicts.
DELETE FROM auth.users WHERE email = 'admin@example.com';
DELETE FROM auth.users WHERE email = 'chris@crowdit.com.au';

DO $$
DECLARE
    user_id uuid := gen_random_uuid();
    -- Dynamically get the instance_id from the auth.instances table.
    -- This makes the script portable across different Supabase projects.
    instance_id uuid;
    user_email text := 'chris@crowdit.com.au';
    user_password text := 'password';
BEGIN
    -- Fetch the single instance_id from the auth.instances table.
    SELECT id INTO instance_id FROM auth.instances LIMIT 1;

    -- Insert the user into auth.users
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmed_at
    )
    VALUES (
        instance_id, user_id, 'authenticated', 'authenticated', user_email, crypt(user_password, gen_salt('bf')), now(),
        '{"provider":"email","providers":["email"]}', '{}', now(), now(), now()
    );

    -- Insert the identity for the user
    INSERT INTO auth.identities (
        id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, provider_id
    )
    VALUES (
        gen_random_uuid(), user_id, jsonb_build_object('sub', user_id, 'email', user_email), 'email', now(), now(), now(), user_email
    );
END $$;
