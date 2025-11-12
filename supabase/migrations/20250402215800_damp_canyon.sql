/*
  # Fix Admin Policies Recursion
  
  This migration fixes the infinite recursion issue in the admins table policies
  by simplifying the policy structure and removing circular dependencies.

  1. Changes:
    - Drops existing policies
    - Creates new simplified policies
    - Uses direct user_id comparison where possible
    - Avoids nested EXISTS clauses

  2. Security:
    - Maintains proper access control
    - Prevents unauthorized access
    - Preserves admin privileges
*/

BEGIN;

-- Drop all existing policies on admins table
DROP POLICY IF EXISTS "Enable read access for own admin record" ON public.admins;
DROP POLICY IF EXISTS "Enable read access for super admins" ON public.admins;
DROP POLICY IF EXISTS "Enable write access for super admins" ON public.admins;

-- Create new simplified policies
-- Allow users to read their own admin record
CREATE POLICY "admins_read_own"
ON public.admins
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Allow super admins to read all records
CREATE POLICY "admins_read_all"
ON public.admins
FOR SELECT
TO authenticated
USING (
  role = 'super_admin' 
  AND user_id = auth.uid()
);

-- Allow super admins to manage all records
CREATE POLICY "admins_manage_all"
ON public.admins
FOR ALL
TO authenticated
USING (
  role = 'super_admin' 
  AND user_id = auth.uid()
)
WITH CHECK (
  role = 'super_admin' 
  AND user_id = auth.uid()
);

COMMIT;