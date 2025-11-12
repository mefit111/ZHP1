/*
  # Recreate Registrations Table
  
  1. Changes
    - Drop existing registrations table
    - Create new registrations table with proper constraints
    - Set up correct RLS policies
    - Grant necessary permissions
    
  2. Security
    - Enable RLS
    - Allow public registration submissions
    - Restrict admin access appropriately
    - Maintain data integrity
*/

BEGIN;

-- Drop existing table and its dependencies
DROP TABLE IF EXISTS public.registration_cards CASCADE;
DROP TABLE IF EXISTS public.registrations CASCADE;

-- Create registrations table
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

-- Enable RLS
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_registrations_camp_id ON public.registrations(camp_id);
CREATE INDEX IF NOT EXISTS idx_registrations_email ON public.registrations(email);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON public.registrations(registration_status, payment_status);
CREATE INDEX IF NOT EXISTS idx_registrations_created_at ON public.registrations(created_at);

-- Create RLS policies

-- Allow public registration submissions
CREATE POLICY "Allow public registration submissions"
ON public.registrations
FOR INSERT
TO public
WITH CHECK (
    payment_status = 'pending' 
    AND registration_status = 'pending'
);

-- Allow admins to view registrations
CREATE POLICY "Registrations are viewable by admins"
ON public.registrations
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM admins
        WHERE user_id = auth.uid()
    )
);

-- Allow admins to manage registrations
CREATE POLICY "Registrations are manageable by admins"
ON public.registrations
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM admins
        WHERE user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM admins
        WHERE user_id = auth.uid()
    )
);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO public, authenticated;
GRANT ALL ON public.registrations TO authenticated;
GRANT INSERT ON public.registrations TO public;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO public, authenticated;

-- Recreate registration_cards table
CREATE TABLE IF NOT EXISTS public.registration_cards (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id uuid REFERENCES public.registrations(id) ON DELETE CASCADE,
    file_path text NOT NULL,
    uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    uploaded_at timestamptz DEFAULT now(),
    UNIQUE(registration_id)
);

-- Enable RLS on registration_cards
ALTER TABLE public.registration_cards ENABLE ROW LEVEL SECURITY;

-- Create policies for registration_cards
CREATE POLICY "Registration cards are viewable by admins"
ON public.registration_cards
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM admins
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Registration cards are manageable by admins"
ON public.registration_cards
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM admins
        WHERE user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM admins
        WHERE user_id = auth.uid()
    )
);

-- Create indexes for registration_cards
CREATE INDEX IF NOT EXISTS idx_registration_cards_registration_id 
ON public.registration_cards(registration_id);

CREATE INDEX IF NOT EXISTS idx_registration_cards_uploaded_by 
ON public.registration_cards(uploaded_by);

COMMIT;