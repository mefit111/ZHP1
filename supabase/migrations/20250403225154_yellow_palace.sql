/*
  # Fix Registration Policies
  
  1. Changes
    - Drop all existing policies
    - Create new optimized policies for:
      - Public registration submissions
      - Admin access
      - Proper validation
    
  2. Security
    - Ensures proper RLS protection
    - Validates registration data
    - Prevents duplicate registrations
*/

BEGIN;

-- Enable RLS
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow all inserts" ON public.registrations;
DROP POLICY IF EXISTS "Allow all registrations for public" ON public.registrations;
DROP POLICY IF EXISTS "Allow public registration submissions" ON public.registrations;
DROP POLICY IF EXISTS "Registrations are manageable by admins" ON public.registrations;
DROP POLICY IF EXISTS "Registrations are viewable by admins" ON public.registrations;

-- Create new INSERT policy for public registrations
CREATE POLICY "Allow public registration submissions"
ON public.registrations
FOR INSERT
TO anon, public
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
    -- Status must be pending
    AND payment_status = 'pending'
    AND registration_status = 'pending'
    -- No duplicate registrations
    AND NOT EXISTS (
        SELECT 1 
        FROM registrations existing
        WHERE existing.camp_id = camp_id
        AND existing.pesel = pesel
        AND existing.registration_status != 'cancelled'
    )
);

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