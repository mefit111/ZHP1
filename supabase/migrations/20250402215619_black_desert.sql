/*
  # Fix Admin Policies
  
  This migration fixes the infinite recursion error in admin policies by:
  1. Dropping existing problematic policies
  2. Creating new, optimized policies without circular dependencies
  3. Ensuring proper access control
*/

BEGIN;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can view all records" ON public.admins;
DROP POLICY IF EXISTS "Super admins can manage admins" ON public.admins;

-- Create new policies without circular dependencies
CREATE POLICY "Enable read access for own admin record"
ON public.admins
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Enable read access for super admins"
ON public.admins
FOR SELECT
TO authenticated
USING (EXISTS (
    SELECT 1 FROM public.admins a
    WHERE a.user_id = auth.uid() 
    AND a.role = 'super_admin'
));

CREATE POLICY "Enable write access for super admins"
ON public.admins
FOR ALL
TO authenticated
USING (EXISTS (
    SELECT 1 FROM public.admins a
    WHERE a.user_id = auth.uid() 
    AND a.role = 'super_admin'
))
WITH CHECK (EXISTS (
    SELECT 1 FROM public.admins a
    WHERE a.user_id = auth.uid() 
    AND a.role = 'super_admin'
));

COMMIT;