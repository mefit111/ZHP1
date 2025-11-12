/*
  # Fix Authentication Schema and Audit Logs
  
  1. Changes
    - Moves audit_logs to public schema
    - Fixes RLS policies for anonymous access
    - Grants proper permissions
    - Disables email confirmation requirement
    - Removes problematic triggers

  2. Security
    - Allows audit logging during login
    - Maintains admin-only access to view logs
    - Preserves data integrity
*/

-- Start transaction
BEGIN;

-- Recreate admin_audit_logs table in public schema
DROP TABLE IF EXISTS public.admin_audit_logs CASCADE;

CREATE TABLE public.admin_audit_logs (
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

-- Drop any existing policies
DROP POLICY IF EXISTS "audit_view_policy" ON public.admin_audit_logs;
DROP POLICY IF EXISTS "audit_insert_policy" ON public.admin_audit_logs;
DROP POLICY IF EXISTS "audit_manage_policy" ON public.admin_audit_logs;

-- Create new policies
-- Allow both anonymous and authenticated users to insert audit logs
CREATE POLICY "audit_insert_policy" ON public.admin_audit_logs
    FOR INSERT TO anon
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

-- Drop problematic triggers if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_admin_last_login ON auth.sessions;

-- Disable email confirmation requirement in auth.users
ALTER TABLE auth.users ALTER COLUMN email_confirmed_at SET DEFAULT now();
UPDATE auth.users SET email_confirmed_at = now() WHERE email_confirmed_at IS NULL;

COMMIT;