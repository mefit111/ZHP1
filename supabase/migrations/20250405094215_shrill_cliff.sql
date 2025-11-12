/*
  # Fix Registration System
  
  1. Changes
    - Drop and recreate registration policies to fix RLS issues
    - Add proper validation for camp capacity
    - Ensure proper status handling
    
  2. Security
    - Maintain RLS protection
    - Allow public registrations
    - Prevent registration conflicts
*/

BEGIN;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public registration submissions" ON registrations;
DROP POLICY IF EXISTS "Registrations are viewable by admins" ON registrations;
DROP POLICY IF EXISTS "Registrations are manageable by admins" ON registrations;

-- Enable RLS
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- Create new INSERT policy with proper validation
CREATE POLICY "Allow public registration submissions"
ON public.registrations
FOR INSERT
TO public
WITH CHECK (
    -- Camp must exist and have available capacity
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
    -- Prevent duplicate registrations
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