/*
  # Fix registrations RLS policies

  1. Changes
    - Remove duplicate and conflicting policies
    - Create a single, clear policy for public registrations
    - Maintain admin management capabilities
    
  2. Security
    - Enable RLS on registrations table (ensuring it's enabled)
    - Add clear policy for public users to submit registrations
    - Preserve admin management capabilities
*/

-- First, drop existing conflicting policies
DROP POLICY IF EXISTS "Allow all inserts" ON registrations;
DROP POLICY IF EXISTS "Allow all registrations for public" ON registrations;
DROP POLICY IF EXISTS "Allow public registration submissions" ON registrations;

-- Ensure RLS is enabled
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- Create a single, clear policy for public registration submissions
CREATE POLICY "Allow public registration submissions"
ON registrations
FOR INSERT
TO public
WITH CHECK (true);

-- Ensure the admin management policy remains
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'registrations' 
    AND policyname = 'Registrations are manageable by admins'
  ) THEN
    CREATE POLICY "Registrations are manageable by admins"
    ON registrations
    FOR ALL
    TO authenticated
    USING (EXISTS (
      SELECT 1
      FROM admins
      WHERE admins.user_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
      SELECT 1
      FROM admins
      WHERE admins.user_id = auth.uid()
    ));
  END IF;
END $$;