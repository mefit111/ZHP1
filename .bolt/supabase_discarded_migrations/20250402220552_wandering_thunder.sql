/*
  # Enhanced RLS Policies Migration
  
  This migration adds and updates Row Level Security policies to ensure proper
  data access control for all tables.

  1. Changes:
    - Creates base tables if they don't exist
    - Adds owner-based policies for registrations
    - Adds admin-only policies for sensitive operations
    - Updates existing policies for better security

  2. Security:
    - Ensures users can only access their own data
    - Maintains admin access control
    - Preserves public access where needed
*/

BEGIN;

-- Create base tables if they don't exist
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

-- Enable RLS on all tables
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own registrations" ON public.registrations;
DROP POLICY IF EXISTS "Users can create registrations" ON public.registrations;
DROP POLICY IF EXISTS "Admins can manage all registrations" ON public.registrations;

DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can create payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can manage all payments" ON public.payments;

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can manage all notifications" ON public.notifications;

-- Create new RLS policies for registrations
CREATE POLICY "Users can view own registrations"
ON public.registrations
FOR SELECT
TO authenticated
USING (
  email = auth.jwt() ->> 'email' OR
  EXISTS (
    SELECT 1 FROM public.admins
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create registrations"
ON public.registrations
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Admins can manage all registrations"
ON public.registrations
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admins
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admins
    WHERE user_id = auth.uid()
  )
);

-- Create new RLS policies for payments
CREATE POLICY "Users can view own payments"
ON public.payments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.registrations r
    WHERE r.id = registration_id
    AND r.email = auth.jwt() ->> 'email'
  ) OR
  EXISTS (
    SELECT 1 FROM public.admins
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create payments"
ON public.payments
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.registrations r
    WHERE r.id = registration_id
    AND r.email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Admins can manage all payments"
ON public.payments
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admins
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admins
    WHERE user_id = auth.uid()
  )
);

-- Create new RLS policies for notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.registrations r
    WHERE r.id = registration_id
    AND r.email = auth.jwt() ->> 'email'
  ) OR
  EXISTS (
    SELECT 1 FROM public.admins
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all notifications"
ON public.notifications
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admins
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admins
    WHERE user_id = auth.uid()
  )
);

-- Add function to check camp capacity
CREATE OR REPLACE FUNCTION check_camp_capacity()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF EXISTS (
      SELECT 1
      FROM public.camps c
      LEFT JOIN public.registrations r ON r.camp_id = c.id
      WHERE c.id = NEW.camp_id
      GROUP BY c.id, c.capacity
      HAVING COUNT(r.id) >= c.capacity
    ) THEN
      RAISE EXCEPTION 'Camp is at full capacity';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger for camp capacity check
DROP TRIGGER IF EXISTS check_camp_capacity_trigger ON public.registrations;
CREATE TRIGGER check_camp_capacity_trigger
  BEFORE INSERT ON public.registrations
  FOR EACH ROW
  EXECUTE FUNCTION check_camp_capacity();

COMMIT;