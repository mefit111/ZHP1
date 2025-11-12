/*
  # Fix Registration RLS Policy
  
  1. Changes
    - Drops all existing policies to start fresh
    - Creates a simple, permissive policy for public registrations
    - Maintains admin access policies
    - Grants necessary permissions
    
  2. Security
    - Enables RLS
    - Allows public registration submissions
    - Preserves admin management capabilities
*/

BEGIN;

-- Enable RLS
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow public registration submissions" ON public.registrations;
DROP POLICY IF EXISTS "Registrations are viewable by admins" ON public.registrations;
DROP POLICY IF EXISTS "Registrations are manageable by admins" ON public.registrations;

-- Create new INSERT policy for public registrations with minimal restrictions
CREATE POLICY "Allow public registration submissions"
ON public.registrations
FOR INSERT
TO public
WITH CHECK (true);

-- Create SELECT policy for admins
CREATE POLICY "Registrations are viewable by admins"
ON public.registrations
FOR SELECT
TO authenticated
USING (EXISTS (
    SELECT 1 FROM admins
    WHERE user_id = auth.uid()
));

-- Create ALL policy for admins
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

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO public, authenticated;
GRANT ALL ON public.registrations TO authenticated;
GRANT INSERT ON public.registrations TO public;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO public, authenticated;

COMMIT;