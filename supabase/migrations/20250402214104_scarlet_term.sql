/*
  # Fix Audit Logs and Authentication
  
  1. Changes
    - Creates admin_audit_logs table in public schema
    - Sets up proper RLS policies
    - Grants necessary permissions
    - Creates performance indexes

  2. Security
    - Allows both anon and authenticated users to insert logs
    - Restricts viewing to admin users only
    - Maintains data integrity
*/

BEGIN;

-- Create admin_audit_logs table
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    action text NOT NULL,
    table_name text,
    record_id uuid,
    old_data jsonb,
    new_data jsonb,
    ip_address text,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow both anonymous and authenticated users to insert audit logs
CREATE POLICY "audit_insert_policy" ON public.admin_audit_logs
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

-- Only admins can view audit logs
CREATE POLICY "audit_view_policy" ON public.admin_audit_logs
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admins
            WHERE user_id = auth.uid()
        )
    );

-- Only admins can manage (update/delete) audit logs
CREATE POLICY "audit_manage_policy" ON public.admin_audit_logs
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admins
            WHERE user_id = auth.uid()
        )
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_user_id ON public.admin_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON public.admin_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON public.admin_audit_logs(action);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT INSERT ON public.admin_audit_logs TO anon;
GRANT ALL ON public.admin_audit_logs TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Create default admin user if not exists
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Create admin@obozy-zhp.pl user if not exists
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@obozy-zhp.pl') THEN
        INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            role,
            created_at,
            updated_at,
            last_sign_in_at
        ) VALUES (
            gen_random_uuid(),
            '00000000-0000-0000-0000-000000000000',
            'admin@obozy-zhp.pl',
            crypt('admin123', gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}'::jsonb,
            '{}'::jsonb,
            'authenticated',
            now(),
            now(),
            now()
        )
        RETURNING id INTO admin_user_id;

        -- Create admin record
        INSERT INTO public.admins (
            user_id,
            role,
            permissions
        ) VALUES (
            admin_user_id,
            'admin',
            '{"can_manage_users": true, "can_manage_camps": true, "can_manage_registrations": true}'::jsonb
        );
    END IF;
END $$;

COMMIT;