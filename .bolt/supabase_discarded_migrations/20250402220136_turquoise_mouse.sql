/*
  # Database Schema Migration
  
  This migration creates the base schema for the Scout Registration System.
  The user creation has been fixed to include all required fields.
*/

BEGIN;

-- Drop existing objects safely
DO $$ 
BEGIN
    -- Drop schemas if they exist
    DROP SCHEMA IF EXISTS admin CASCADE;
    
    -- Drop public tables if they exist
    DROP TABLE IF EXISTS public.notifications CASCADE;
    DROP TABLE IF EXISTS public.payments CASCADE;
    DROP TABLE IF EXISTS public.registrations CASCADE;
    DROP TABLE IF EXISTS public.camps CASCADE;
    DROP TABLE IF EXISTS public.admins CASCADE;
    
    -- Drop functions if they exist
    DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
    DROP FUNCTION IF EXISTS admin.log_action() CASCADE;
EXCEPTION
    WHEN OTHERS THEN 
        RAISE NOTICE 'Error during cleanup: %', SQLERRM;
END $$;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS admin;

-- Create admins table FIRST (required for RLS policies)
CREATE TABLE public.admins (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('admin', 'super_admin')),
    permissions jsonb DEFAULT '{}',
    last_login timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id)
);

-- Create remaining tables
CREATE TABLE public.camps (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    price numeric NOT NULL CHECK (price > 0),
    capacity integer NOT NULL CHECK (capacity > 0),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT valid_dates CHECK (end_date >= start_date)
);

CREATE TABLE public.registrations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    camp_id uuid REFERENCES public.camps(id) ON DELETE SET NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    pesel text NOT NULL CHECK (pesel ~ '^[0-9]{11}$'),
    birth_date date NOT NULL,
    email text NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    phone text NOT NULL CHECK (phone ~ '^[0-9+\-\s]{9,15}$'),
    address text NOT NULL,
    city text NOT NULL,
    postal_code text NOT NULL CHECK (postal_code ~ '^[0-9]{2}-[0-9]{3}$'),
    zhp_status text,
    notes text,
    payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'completed', 'refunded')),
    registration_status text DEFAULT 'pending' CHECK (registration_status IN ('pending', 'confirmed', 'cancelled')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id uuid REFERENCES public.registrations(id) ON DELETE SET NULL,
    amount numeric NOT NULL CHECK (amount > 0),
    status text NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_date timestamptz,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE public.notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id uuid REFERENCES public.registrations(id) ON DELETE SET NULL,
    type text NOT NULL CHECK (type IN ('registration', 'payment', 'reminder', 'confirmation')),
    subject text NOT NULL,
    content text NOT NULL,
    sent_at timestamptz DEFAULT now()
);

CREATE TABLE admin.audit_logs (
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

CREATE TABLE admin.notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    message text NOT NULL,
    severity text CHECK (severity IN ('info', 'warning', 'error', 'success')),
    is_read boolean DEFAULT false,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    read_at timestamptz
);

-- Create indexes
CREATE INDEX idx_camps_dates ON public.camps(start_date, end_date);
CREATE INDEX idx_registrations_camp ON public.registrations(camp_id);
CREATE INDEX idx_registrations_status ON public.registrations(registration_status, payment_status);
CREATE INDEX idx_payments_registration ON public.payments(registration_id);
CREATE INDEX idx_notifications_registration ON public.notifications(registration_id);
CREATE INDEX idx_notifications_type ON public.notifications(type);
CREATE INDEX idx_admins_user_id ON public.admins(user_id);
CREATE INDEX idx_audit_logs_user_id ON admin.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON admin.audit_logs(action);
CREATE INDEX idx_admin_notifications_user ON admin.notifications(user_id);
CREATE INDEX idx_admin_notifications_unread ON admin.notifications(user_id) WHERE NOT is_read;

-- Enable RLS
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.camps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admins can view all records" ON public.admins
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.admins WHERE user_id = auth.uid()
    ));

CREATE POLICY "Super admins can manage admins" ON public.admins
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.admins
        WHERE user_id = auth.uid() AND role = 'super_admin'
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.admins
        WHERE user_id = auth.uid() AND role = 'super_admin'
    ));

CREATE POLICY "Camps are viewable by everyone" ON public.camps
    FOR SELECT TO public USING (true);

CREATE POLICY "Camps are manageable by admins" ON public.camps
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.admins WHERE user_id = auth.uid()
    ));

CREATE POLICY "Registrations can be created by anyone" ON public.registrations
    FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Registrations are manageable by admins" ON public.registrations
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.admins WHERE user_id = auth.uid()
    ));

CREATE POLICY "Payments can be created by anyone" ON public.payments
    FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Payments are manageable by admins" ON public.payments
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.admins WHERE user_id = auth.uid()
    ));

CREATE POLICY "Notifications are manageable by admins" ON public.notifications
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.admins WHERE user_id = auth.uid()
    ));

CREATE POLICY "Admins can view audit logs" ON admin.audit_logs
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.admins WHERE user_id = auth.uid()
    ));

CREATE POLICY "System can create audit logs" ON admin.audit_logs
    FOR INSERT TO authenticated WITH CHECK (true);

-- Create helper functions
CREATE OR REPLACE FUNCTION admin.log_action()
RETURNS trigger AS $$
BEGIN
    INSERT INTO admin.audit_logs (
        user_id, action, table_name, record_id, old_data, new_data
    ) VALUES (
        auth.uid(),
        TG_OP,
        TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME,
        CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
        CASE WHEN TG_OP IN ('DELETE', 'UPDATE') THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END
    );
    RETURN NULL;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to log action: %', SQLERRM;
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle admin creation on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
    -- Create admin record for specific email addresses
    IF NEW.email IN ('superadmin@obozy-zhp.pl', 'admin@obozy-zhp.pl') THEN
        INSERT INTO public.admins (user_id, role, permissions)
        VALUES (
            NEW.id,
            CASE 
                WHEN NEW.email = 'superadmin@obozy-zhp.pl' THEN 'super_admin'
                ELSE 'admin'
            END,
            CASE 
                WHEN NEW.email = 'superadmin@obozy-zhp.pl' THEN 
                    '{"can_manage_users": true, "can_manage_camps": true, "can_manage_registrations": true, "can_manage_admins": true}'::jsonb
                ELSE 
                    '{"can_manage_users": true, "can_manage_camps": true, "can_manage_registrations": true}'::jsonb
            END
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER audit_admin_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.admins
    FOR EACH ROW EXECUTE FUNCTION admin.log_action();

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT USAGE ON SCHEMA admin TO authenticated;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

GRANT SELECT, INSERT ON admin.audit_logs TO authenticated;
GRANT ALL ON admin.notifications TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA admin TO authenticated;

-- Create initial admin users
DO $$
DECLARE
    super_admin_id uuid := gen_random_uuid();
    admin_id uuid := gen_random_uuid();
BEGIN
    -- Create super admin
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'superadmin@obozy-zhp.pl') THEN
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
            last_sign_in_at,
            confirmation_token,
            recovery_token,
            aud,
            confirmation_sent_at
        ) VALUES (
            super_admin_id,
            '00000000-0000-0000-0000-000000000000',
            'superadmin@obozy-zhp.pl',
            crypt('superadmin123', gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}'::jsonb,
            '{}'::jsonb,
            'authenticated',
            true,
            now(),
            now(),
            now(),
            '',
            '',
            'authenticated',
            now()
        );
    END IF;

    -- Create regular admin
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
            is_super_admin,
            created_at,
            updated_at,
            last_sign_in_at,
            confirmation_token,
            recovery_token,
            aud,
            confirmation_sent_at
        ) VALUES (
            admin_id,
            '00000000-0000-0000-0000-000000000000',
            'admin@obozy-zhp.pl',
            crypt('admin123', gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}'::jsonb,
            '{}'::jsonb,
            'authenticated',
            false,
            now(),
            now(),
            now(),
            '',
            '',
            'authenticated',
            now()
        );
    END IF;
END $$;

COMMIT;