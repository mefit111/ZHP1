/*
  # Fix Registrations RLS Policy
  
  1. Changes
    - Drops existing restrictive policies
    - Creates new policies that allow:
      - Public users to create registrations
      - Admins to manage all registrations
    
  2. Security
    - Maintains data integrity
    - Preserves admin access
    - Allows public registration
*/

BEGIN;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Registrations can be created by anyone" ON public.registrations;
DROP POLICY IF EXISTS "Registrations are viewable by admins" ON public.registrations;
DROP POLICY IF EXISTS "Registrations are manageable by admins" ON public.registrations;

-- Create new policies

-- Allow anyone to create registrations
CREATE POLICY "Registrations can be created by anyone"
ON public.registrations
FOR INSERT
TO public
WITH CHECK (true);

-- Allow admins to view all registrations
CREATE POLICY "Registrations are viewable by admins"
ON public.registrations
FOR SELECT
TO authenticated
USING (EXISTS (
    SELECT 1 FROM public.admins
    WHERE user_id = auth.uid()
));

-- Allow admins to manage all registrations
CREATE POLICY "Registrations are manageable by admins"
ON public.registrations
FOR ALL
TO authenticated
USING (EXISTS (
    SELECT 1 FROM public.admins
    WHERE user_id = auth.uid()
))
WITH CHECK (EXISTS (
    SELECT 1 FROM public.admins
    WHERE user_id = auth.uid()
));

COMMIT;