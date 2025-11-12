/*
  # Fix Registration RLS Policy
  
  1. Changes
    - Drop existing policies
    - Create new simplified policies
    - Add unique index for active registrations
    
  2. Security
    - Maintains RLS protection
    - Prevents duplicate registrations
    - Allows public access
*/

BEGIN;

-- Enable RLS
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to ensure clean state
DROP POLICY IF EXISTS "Allow public registration submissions" ON public.registrations;
DROP POLICY IF EXISTS "Registrations are viewable by admins" ON public.registrations;
DROP POLICY IF EXISTS "Registrations are manageable by admins" ON public.registrations;

-- Create new INSERT policy for public registrations with minimal restrictions
CREATE POLICY "Allow public registration submissions"
ON public.registrations
FOR INSERT
TO public
WITH CHECK (true);

-- Create admin policies
CREATE POLICY "Registrations are viewable by admins"
ON public.registrations
FOR SELECT
TO authenticated
USING (EXISTS (
    SELECT 1 FROM admins
    WHERE user_id = auth.uid()
));

CREATE POLICY "Registrations are manageable by admins"
ON public.registrations
FOR ALL
TO authenticated
USING (EXISTS (
    SELECT 1 FROM admins
    WHERE user_id = auth.uid()
))
WITH CHECK (EXISTS (
    SELECT 1 FROM admins
    WHERE user_id = auth.uid()
));

-- Drop existing index if it exists
DROP INDEX IF EXISTS idx_active_registration;

-- Create unique index for active registrations
CREATE UNIQUE INDEX idx_active_registration 
ON public.registrations (camp_id, pesel) 
WHERE registration_status <> 'cancelled';

COMMIT;