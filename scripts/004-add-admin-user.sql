-- This script adds a default admin user with credentials:
-- Email: admin@example.com
-- Password: admin
-- It's highly recommended to change this password in a production environment.

DO $$
DECLARE
    user_id uuid := gen_random_uuid();
    -- You might need to replace this with your actual instance_id if it's not the default.
    -- You can find it in your Supabase project settings or by querying the auth.instances table.
    instance_id uuid := '00000000-0000-0000-0000-000000000000';
    user_email text := 'admin@example.com';
    user_password text := 'admin';
BEGIN
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
