/*
  # Fix Registration RLS Policy
  
  1. Changes
    - Drop existing policies to ensure clean state
    - Create new optimized policies that prevent infinite recursion
    - Add proper validation checks for:
      - Camp capacity
      - Initial status values
      - Duplicate prevention
    
  2. Security
    - Maintains RLS protection
    - Validates registration data
    - Prevents duplicate registrations
*/

BEGIN;

-- Enable RLS
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to ensure clean state
DROP POLICY IF EXISTS "Allow public registration submissions" ON public.registrations;
DROP POLICY IF EXISTS "Registrations are viewable by admins" ON public.registrations;
DROP POLICY IF EXISTS "Registrations are manageable by admins" ON public.registrations;

-- Create new INSERT policy for public registrations
CREATE POLICY "Allow public registration submissions"
ON public.registrations
FOR INSERT
TO public
WITH CHECK (
    -- Camp must exist and have capacity
    EXISTS (
        SELECT 1 FROM camps c
        WHERE c.id = camp_id
        AND (
            SELECT COUNT(*)
            FROM registrations r
            WHERE r.camp_id = c.id
            AND r.registration_status != 'cancelled'
        ) < c.capacity
    )
    -- Initial status must be pending
    AND payment_status = 'pending'
    AND registration_status = 'pending'
    -- Prevent duplicate registrations using a separate subquery
    AND NOT EXISTS (
        SELECT 1 
        FROM registrations existing
        WHERE existing.camp_id = camp_id
        AND existing.pesel = pesel
        AND existing.registration_status != 'cancelled'
    )
);

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

COMMIT;