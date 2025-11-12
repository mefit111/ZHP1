/*
  # Initial Schema Migration
  
  This migration creates the base schema for the Scout Registration System.
  All index creations are protected with IF NOT EXISTS to avoid conflicts.
*/

BEGIN;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS admin;

-- Create admins table FIRST since it's a dependency for RLS policies
CREATE TABLE IF NOT EXISTS public.admins (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('admin', 'super_admin')),
    permissions jsonb DEFAULT '{}',
    last_login timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id)
);

-- Create other base tables
CREATE TABLE IF NOT EXISTS public.camps (
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

CREATE TABLE IF NOT EXISTS public.registrations (
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

CREATE TABLE IF NOT EXISTS public.payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id uuid REFERENCES public.registrations(id) ON DELETE SET NULL,
    amount numeric NOT NULL CHECK (amount > 0),
    status text NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_date timestamptz,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id uuid REFERENCES public.registrations(id) ON DELETE SET NULL,
    type text NOT NULL CHECK (type IN ('registration', 'payment', 'reminder', 'confirmation')),
    subject text NOT NULL,
    content text NOT NULL,
    sent_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin.audit_logs (
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

CREATE TABLE IF NOT EXISTS admin.notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    message text NOT NULL,
    severity text CHECK (severity IN ('info', 'warning', 'error', 'success')),
    is_read boolean DEFAULT false,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    read_at timestamptz
);

-- Create indexes with IF NOT EXISTS
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_camps_dates') THEN
        CREATE INDEX idx_camps_dates ON public.camps(start_date, end_date);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_registrations_camp') THEN
        CREATE INDEX idx_registrations_camp ON public.registrations(camp_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_registrations_status') THEN
        CREATE INDEX idx_registrations_status ON public.registrations(registration_status, payment_status);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_registrations_email') THEN
        CREATE INDEX idx_registrations_email ON public.registrations(email);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payments_registration') THEN
        CREATE INDEX idx_payments_registration ON public.payments(registration_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payments_status') THEN
        CREATE INDEX idx_payments_status ON public.payments(status);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_notifications_registration') THEN
        CREATE INDEX idx_notifications_registration ON public.notifications(registration_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_notifications_type') THEN
        CREATE INDEX idx_notifications_type ON public.notifications(type);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_admins_user_id') THEN
        CREATE INDEX idx_admins_user_id ON public.admins(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_audit_logs_user_id') THEN
        CREATE INDEX idx_audit_logs_user_id ON admin.audit_logs(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_audit_logs_action') THEN
        CREATE INDEX idx_audit_logs_action ON admin.audit_logs(action);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_audit_logs_created_at') THEN
        CREATE INDEX idx_audit_logs_created_at ON admin.audit_logs(created_at);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_admin_notifications_user') THEN
        CREATE INDEX idx_admin_notifications_user ON admin.notifications(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_admin_notifications_unread') THEN
        CREATE INDEX idx_admin_notifications_unread ON admin.notifications(user_id) WHERE NOT is_read;
    END IF;
END $$;

-- Enable RLS (after all tables are created)
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.camps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admins can view all admins" ON public.admins
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

CREATE POLICY "Camps are viewable by everyone" ON public.camps
    FOR SELECT TO public USING (true);

CREATE POLICY "Camps are manageable by admins" ON public.camps
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

CREATE POLICY "Registrations can be created by authenticated users" ON public.registrations
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Registrations are manageable by admins" ON public.registrations
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

CREATE POLICY "Payments can be created by authenticated users" ON public.payments
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Payments are manageable by admins" ON public.payments
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

CREATE POLICY "Notifications are manageable by admins" ON public.notifications
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

CREATE POLICY "Enable read access for audit logs" ON admin.audit_logs
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

CREATE POLICY "Enable insert for audit logs" ON admin.audit_logs
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can view own notifications" ON admin.notifications
    FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage notifications" ON admin.notifications
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

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
        RAISE NOTICE 'Error in log_action: %', SQLERRM;
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.update_admin_last_login()
RETURNS trigger AS $$
BEGIN
    UPDATE public.admins
    SET last_login = now()
    WHERE user_id = auth.uid();
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in update_admin_last_login: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.send_registration_email()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.notifications (
        registration_id, type, subject, content
    ) VALUES (
        NEW.id,
        'registration',
        'Potwierdzenie zapisu na obóz',
        format(
            'Dziękujemy za zapisanie się na obóz. Twoje dane:%s%s%s%s%s%s%s',
            E'\n\nImię i nazwisko: ' || NEW.first_name || ' ' || NEW.last_name,
            E'\nEmail: ' || NEW.email,
            E'\nTelefon: ' || NEW.phone,
            E'\nPESEL: ' || NEW.pesel,
            E'\nData urodzenia: ' || NEW.birth_date,
            E'\nAdres: ' || NEW.address || ', ' || NEW.postal_code || ' ' || NEW.city,
            CASE WHEN NEW.zhp_status IS NOT NULL THEN E'\nStatus ZHP: ' || NEW.zhp_status ELSE '' END
        )
    );
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in send_registration_email: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
CREATE TRIGGER audit_admins_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.admins
    FOR EACH ROW EXECUTE FUNCTION admin.log_action();

CREATE TRIGGER audit_notifications_changes
    AFTER INSERT OR UPDATE OR DELETE ON admin.notifications
    FOR EACH ROW EXECUTE FUNCTION admin.log_action();

CREATE TRIGGER update_admin_last_login
    AFTER INSERT ON auth.sessions
    FOR EACH ROW EXECUTE FUNCTION public.update_admin_last_login();

CREATE TRIGGER trigger_registration_email
    AFTER INSERT ON public.registrations
    FOR EACH ROW EXECUTE FUNCTION public.send_registration_email();

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT USAGE ON SCHEMA admin TO authenticated;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

GRANT SELECT, INSERT ON admin.audit_logs TO authenticated;
GRANT ALL ON admin.notifications TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA admin TO authenticated;

-- Insert sample data conditionally
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.camps WHERE name = 'ZIMOWISKO W MAŁE CICHE') THEN
        INSERT INTO public.camps (name, start_date, end_date, price, capacity) VALUES
            ('ZIMOWISKO W MAŁE CICHE', '2025-01-20', '2025-01-27', 1899, 45),
            ('OBÓZ NARCIARSKI W ZAKOPANEM', '2025-02-10', '2025-02-17', 2199, 40),
            ('OBÓZ ŻEGLARSKI W PRZEBRNIE', '2025-07-01', '2025-07-14', 2899, 30),
            ('OBÓZ W PRZEBRNIE', '2025-07-15', '2025-07-28', 2499, 60),
            ('OBÓZ SURVIVALOWY W BIESZCZADACH', '2025-07-20', '2025-08-02', 2699, 25),
            ('KOLONIA W MAŁE CICHE', '2025-08-01', '2025-08-14', 2299, 50),
            ('OBÓZ JĘZYKOWY W MAŁE CICHE', '2025-08-16', '2025-08-29', 2599, 35),
            ('OBÓZ WSPINACZKOWY W TATRACH', '2025-08-20', '2025-08-31', 2799, 20);
    END IF;
END;
$$;

COMMIT;