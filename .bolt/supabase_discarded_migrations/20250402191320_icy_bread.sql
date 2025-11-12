-- Start transaction
BEGIN;

-- Drop existing admin schema and recreate it
DROP SCHEMA IF EXISTS admin CASCADE;
CREATE SCHEMA admin;

-- Create admin_audit_logs table in public schema instead
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

-- Create admin_notifications table in public schema
CREATE TABLE IF NOT EXISTS public.admin_notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    message text NOT NULL,
    severity text CHECK (severity IN ('info', 'warning', 'error', 'success')),
    is_read boolean DEFAULT false,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    read_at timestamptz
);

-- Enable RLS on new tables
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for admin_audit_logs
CREATE POLICY "audit_view_policy" ON public.admin_audit_logs
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.admins WHERE user_id = auth.uid()
    ));

CREATE POLICY "audit_create_policy" ON public.admin_audit_logs
    FOR INSERT TO authenticated WITH CHECK (true);

-- Create policies for admin_notifications
CREATE POLICY "admin_notification_view_policy" ON public.admin_notifications
    FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.admins WHERE user_id = auth.uid()
    ));

CREATE POLICY "admin_notification_manage_policy" ON public.admin_notifications
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.admins WHERE user_id = auth.uid()
    ));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_user_id ON public.admin_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON public.admin_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_user_id ON public.admin_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_unread ON public.admin_notifications(user_id) WHERE NOT is_read;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT ON public.admin_audit_logs TO authenticated;
GRANT ALL ON public.admin_notifications TO authenticated;

COMMIT;