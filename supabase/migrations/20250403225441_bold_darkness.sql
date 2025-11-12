/*
  # Fix Registration System
  
  1. Changes
    - Drop all existing registration policies
    - Create new simplified policies that work correctly
    - Grant proper permissions
    - Fix RLS implementation
    
  2. Security
    - Maintain proper access control
    - Ensure data integrity
    - Allow public registrations
*/

BEGIN;

-- Enable RLS
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow public registration submissions" ON public.registrations;
DROP POLICY IF EXISTS "Registrations are viewable by admins" ON public.registrations;
DROP POLICY IF EXISTS "Registrations are manageable by admins" ON public.registrations;

-- Create new simplified INSERT policy for public registrations
CREATE POLICY "Allow public registration submissions"
ON public.registrations
FOR INSERT
TO public
WITH CHECK (
    -- Camp must exist
    EXISTS (
        SELECT 1 FROM camps c
        WHERE c.id = camp_id
    )
    -- Status must be pending
    AND payment_status = 'pending'
    AND registration_status = 'pending'
);

-- Create SELECT policy for admins
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

-- Create ALL policy for admins
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
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.registrations TO authenticated;
GRANT INSERT ON public.registrations TO public;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

COMMIT;