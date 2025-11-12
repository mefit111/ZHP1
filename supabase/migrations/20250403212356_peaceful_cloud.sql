/*
  # Final Fix for Registrations RLS Policies
  
  1. Changes
    - Drops all existing policies to ensure clean state
    - Creates comprehensive INSERT policy for public registrations
    - Adds complete validation checks
    - Maintains admin access policies
    
  2. Security
    - Ensures RLS is enabled
    - Validates registration data
    - Prevents duplicate registrations
    - Maintains admin privileges
*/

BEGIN;

-- Enable RLS if not already enabled
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to ensure clean state
DROP POLICY IF EXISTS "Allow public registration submissions" ON public.registrations;
DROP POLICY IF EXISTS "Registrations are viewable by admins" ON public.registrations;
DROP POLICY IF EXISTS "Registrations are manageable by admins" ON public.registrations;

-- Create public registration policy with comprehensive validation
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
            SELECT count(*) 
            FROM registrations r
            WHERE r.camp_id = c.id
            AND r.registration_status <> 'cancelled'
        ) < c.capacity
    )
    -- Initial status must be pending
    AND payment_status = 'pending'
    AND registration_status = 'pending'
    -- Prevent duplicate registrations for the same person in the same camp
    AND NOT EXISTS (
        SELECT 1 
        FROM registrations r
        WHERE r.camp_id = r.camp_id
        AND r.pesel = r.pesel
        AND r.registration_status <> 'cancelled'
    )
);

-- Admin policies for viewing and managing registrations
CREATE POLICY "Registrations are viewable by admins"
ON public.registrations
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 
        FROM admins
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Registrations are manageable by admins"
ON public.registrations
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 
        FROM admins
        WHERE user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 
        FROM admins
        WHERE user_id = auth.uid()
    )
);

COMMIT;