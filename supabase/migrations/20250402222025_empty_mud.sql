/*
  # Create Registrations Table Migration
  
  1. New Tables
    - `registrations`
      - `id` (uuid, primary key)
      - `camp_id` (uuid, references camps.id)
      - `first_name` (text)
      - `last_name` (text)
      - `pesel` (text)
      - `birth_date` (date)
      - `email` (text)
      - `phone` (text)
      - `address` (text)
      - `city` (text)
      - `postal_code` (text)
      - `zhp_status` (text, optional)
      - `notes` (text, optional)
      - `payment_status` (text)
      - `registration_status` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add appropriate policies
    - Create necessary indexes
*/

BEGIN;

-- Create registrations table
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

-- Enable RLS
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Registrations can be created by anyone" ON public.registrations
    FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Registrations are viewable by admins" ON public.registrations
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.admins WHERE user_id = auth.uid()
    ));

CREATE POLICY "Registrations are manageable by admins" ON public.registrations
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.admins WHERE user_id = auth.uid()
    ));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_registrations_camp_id ON public.registrations(camp_id);
CREATE INDEX IF NOT EXISTS idx_registrations_email ON public.registrations(email);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON public.registrations(registration_status, payment_status);
CREATE INDEX IF NOT EXISTS idx_registrations_created_at ON public.registrations(created_at);

COMMIT;