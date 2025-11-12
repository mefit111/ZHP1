/*
  # Fix Registrations RLS Policy
  
  1. Changes
    - Drops all existing registration policies to avoid conflicts
    - Creates new optimized policies for:
      - Public registration submissions
      - Admin management
      - Capacity checks
      - Duplicate prevention
    
  2. Security
    - Maintains proper access control
    - Prevents registration conflicts
    - Ensures data integrity
    - Enforces business rules
*/

BEGIN;

-- Enable RLS if not already enabled
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow public registration submissions" ON public.registrations;
DROP POLICY IF EXISTS "Registrations are viewable by admins" ON public.registrations;
DROP POLICY IF EXISTS "Registrations are manageable by admins" ON public.registrations;

-- VARIANT A: Public Registration Policy (Default)
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
            AND r.registration_status <> 'cancelled'
        ) < c.capacity
    )
    -- Initial status must be pending
    AND payment_status = 'pending'
    AND registration_status = 'pending'
    -- Prevent duplicate registrations
    AND NOT EXISTS (
        SELECT 1 
        FROM registrations r
        WHERE r.camp_id = camp_id
        AND r.pesel = pesel
        AND r.registration_status <> 'cancelled'
    )
);

-- Admin Policies
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

-- VARIANT B: Authenticated-only Registration Policy
-- To use this instead of Variant A, drop the public policy and uncomment this:
/*
CREATE POLICY "Allow authenticated registration submissions"
ON public.registrations
FOR INSERT
TO authenticated
WITH CHECK (
    -- Camp must exist and have available capacity
    EXISTS (
        SELECT 1 FROM camps c
        WHERE c.id = camp_id
        AND (
            SELECT COUNT(*)
            FROM registrations r
            WHERE r.camp_id = c.id
            AND r.registration_status <> 'cancelled'
        ) < c.capacity
    )
    -- Initial status must be pending
    AND payment_status = 'pending'
    AND registration_status = 'pending'
    -- Prevent duplicate registrations
    AND NOT EXISTS (
        SELECT 1 
        FROM registrations r
        WHERE r.camp_id = camp_id
        AND r.pesel = pesel
        AND r.registration_status <> 'cancelled'
    )
);
*/

COMMIT;