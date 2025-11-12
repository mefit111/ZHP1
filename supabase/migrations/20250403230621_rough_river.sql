/*
  # Fix registrations RLS policies

  1. Changes
    - Drop existing RLS policies for registrations table
    - Create new, properly configured policies:
      - Allow anonymous and public users to insert new registrations
      - Allow admins to manage all registrations
      - Allow admins to view all registrations

  2. Security
    - Maintains strict access control while fixing registration submission
    - Ensures proper separation of concerns between public and admin access
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow anon registration submissions" ON registrations;
DROP POLICY IF EXISTS "Allow public registration submissions" ON registrations;
DROP POLICY IF EXISTS "Registrations are manageable by admins" ON registrations;
DROP POLICY IF EXISTS "Registrations are viewable by admins" ON registrations;

-- Create new policies
CREATE POLICY "Allow anon registration submissions" 
ON registrations 
FOR INSERT 
TO anon
WITH CHECK (true);

CREATE POLICY "Allow public registration submissions" 
ON registrations 
FOR INSERT 
TO public
WITH CHECK (true);

CREATE POLICY "Registrations are manageable by admins" 
ON registrations 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM admins 
    WHERE admins.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM admins 
    WHERE admins.user_id = auth.uid()
  )
);

CREATE POLICY "Registrations are viewable by admins" 
ON registrations 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM admins 
    WHERE admins.user_id = auth.uid()
  )
);