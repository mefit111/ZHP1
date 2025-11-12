/*
  # Fix Audit Logs RLS Policies Migration
  
  This migration updates the Row Level Security (RLS) policies for the admin_audit_logs table
  to ensure proper access control and fix the "violates row-level security policy" error.

  1. Changes
    - Enables RLS on admin_audit_logs table
    - Creates policies for INSERT and SELECT operations
    - Grants necessary permissions to authenticated users

  2. Security
    - Allows authenticated users to create audit logs
    - Restricts viewing to admin users only
*/

-- Start transaction
BEGIN;

-- Enable RLS on admin_audit_logs table
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "audit_view_policy" ON public.admin_audit_logs;
DROP POLICY IF EXISTS "audit_create_policy" ON public.admin_audit_logs;
DROP POLICY IF EXISTS "audit_insert_policy" ON public.admin_audit_logs;

-- Create new RLS policies
CREATE POLICY "audit_view_policy" ON public.admin_audit_logs
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.admins
        WHERE user_id = auth.uid()
    ));

CREATE POLICY "audit_insert_policy" ON public.admin_audit_logs
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT ON public.admin_audit_logs TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

COMMIT;