/*
  # Fix Audit Logs RLS Policies

  1. Changes
    - Recreates admin_audit_logs table in public schema
    - Sets up proper RLS policies for audit logging
    - Grants necessary permissions
    - Creates performance indexes

  2. Security
    - Allows authenticated users to insert audit logs
    - Restricts viewing to admin users only
    - Maintains data integrity with proper constraints
*/

-- Start transaction
BEGIN;

-- Recreate admin_audit_logs table with proper structure
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
-- Allow any authenticated user to insert audit logs
CREATE POLICY "audit_insert_policy" ON public.admin_audit_logs
    FOR INSERT TO authenticated
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
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT ON public.admin_audit_logs TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

COMMIT;