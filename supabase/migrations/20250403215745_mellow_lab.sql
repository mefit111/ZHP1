/*
  # Final Fix for Registration RLS Policy
  
  1. Changes
    - Drops all existing policies to ensure clean state
    - Creates simplified INSERT policy for public registrations
    - Maintains necessary validation checks
    - Preserves admin access policies
    
  2. Security
    - Ensures data integrity
    - Prevents duplicate registrations
    - Maintains proper access control
*/

BEGIN;

-- Enable RLS if not already enabled
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to ensure clean state
DROP POLICY IF EXISTS "Allow public registration submissions" ON public.registrations;
DROP POLICY IF EXISTS "Registrations are viewable by admins" ON public.registrations;
DROP POLICY IF EXISTS "Registrations are manageable by admins" ON public.registrations;

-- Create simplified public registration policy
CREATE POLICY "Allow public registration submissions"
ON public.registrations
FOR INSERT
TO public
WITH CHECK (
    -- Initial status must be pending
    payment_status = 'pending'
    AND registration_status = 'pending'
    -- Ensure camp exists and has capacity
    AND EXISTS (
        SELECT 1 FROM camps c
        WHERE c.id = camp_id
        AND (
            SELECT COUNT(*)
            FROM registrations r
            WHERE r.camp_id = c.id
            AND r.registration_status != 'cancelled'
        ) < c.capacity
    )
    -- Prevent duplicate registrations
    AND NOT EXISTS (
        SELECT 1 
        FROM registrations existing
        WHERE existing.camp_id = camp_id
        AND existing.pesel = pesel
        AND existing.registration_status != 'cancelled'
    )
);

-- Admin policies
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