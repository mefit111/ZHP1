/*
  # Create Super Admin User Migration
  
  1. Changes
    - Creates a new user in auth.users with explicit UUID
    - Creates corresponding admin record
    - Sets super_admin role and full permissions
    
  2. Security
    - Sets up proper authentication
    - Grants necessary admin privileges
*/

BEGIN;

DO $$
DECLARE
    new_user_id uuid := gen_random_uuid();
BEGIN
    -- Create the user in auth.users if they don't exist
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'hetorek1997@gmail.com') THEN
        INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            role,
            is_super_admin,
            created_at,
            updated_at,
            last_sign_in_at
        ) VALUES (
            new_user_id,
            '00000000-0000-0000-0000-000000000000',
            'hetorek1997@gmail.com',
            crypt('superadmin123', gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}'::jsonb,
            '{}'::jsonb,
            'authenticated',
            true,
            now(),
            now(),
            now()
        );

        -- Create admin record for the user
        INSERT INTO public.admins (
            user_id,
            role,
            permissions
        ) VALUES (
            new_user_id,
            'super_admin',
            '{"can_manage_users": true, "can_manage_camps": true, "can_manage_registrations": true, "can_manage_admins": true}'::jsonb
        );
    END IF;
END $$;

COMMIT;