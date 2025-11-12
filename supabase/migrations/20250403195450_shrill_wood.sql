/*
  # Fix Registrations RLS Policies
  
  1. Changes
    - Ensures RLS is enabled
    - Drops existing problematic policies
    - Creates new policies for:
      - Public registration submissions
      - Admin management
    
  2. Security
    - Validates camp capacity
    - Enforces default statuses
    - Maintains data integrity
*/

BEGIN;

-- Enable RLS if not already enabled
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow public registration submissions" ON public.registrations;
DROP POLICY IF EXISTS "Registrations are viewable by admins" ON public.registrations;
DROP POLICY IF EXISTS "Registrations are manageable by admins" ON public.registrations;

-- VARIANT A: Allow public registrations (no authentication required)
CREATE POLICY "Allow public registration submissions"
ON public.registrations
FOR INSERT
TO public
WITH CHECK (
    -- Ensure camp exists and has available capacity
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
    -- Enforce default statuses
    AND payment_status = 'pending'
    AND registration_status = 'pending'
);

-- Allow admins to view all registrations
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

-- Allow admins to manage all registrations
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

-- VARIANT B: To switch to authenticated-only registrations,
-- replace the first policy with this one (commented out for now):
/*
CREATE POLICY "Allow authenticated registration submissions"
ON public.registrations
FOR INSERT
TO authenticated
WITH CHECK (
    -- Ensure camp exists and has available capacity
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
    -- Enforce default statuses
    AND payment_status = 'pending'
    AND registration_status = 'pending'
);
*/

COMMIT;