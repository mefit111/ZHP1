/*
  # Fix Registration RLS Policy
  
  1. Changes
    - Drop all existing policies
    - Create new simplified policy that allows public registrations
    - Grant proper permissions to public role
    
  2. Security
    - Maintains basic validation
    - Allows public access
    - Preserves admin capabilities
*/

BEGIN;

-- Enable RLS
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow public registration submissions" ON public.registrations;
DROP POLICY IF EXISTS "Registrations are viewable by admins" ON public.registrations;
DROP POLICY IF EXISTS "Registrations are manageable by admins" ON public.registrations;

-- Create new INSERT policy for public registrations
CREATE POLICY "Allow public registration submissions"
ON public.registrations
FOR INSERT
TO anon
WITH CHECK (true);

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
GRANT INSERT ON public.registrations TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

COMMIT;