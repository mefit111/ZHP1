/*
  # Fix registrations table RLS policies

  1. Security Changes
    - Drop existing public registration policy
    - Create new policy allowing public registration submissions with proper check conditions
    - Keep existing admin policies unchanged

  Note: This migration ensures that:
    - Anyone can submit a registration (public access)
    - Only one registration per person per camp is allowed (via existing unique index)
    - All required fields are properly validated (via existing check constraints)
*/

-- Drop the existing public registration policy
DROP POLICY IF EXISTS "Allow public registration submissions" ON registrations;

-- Create new policy with proper conditions
CREATE POLICY "Allow public registration submissions"
ON registrations
FOR INSERT
TO public
WITH CHECK (
  -- Ensure required fields are provided
  first_name IS NOT NULL AND
  last_name IS NOT NULL AND
  pesel IS NOT NULL AND
  birth_date IS NOT NULL AND
  email IS NOT NULL AND
  phone IS NOT NULL AND
  address IS NOT NULL AND
  city IS NOT NULL AND
  postal_code IS NOT NULL AND
  -- Ensure status fields have correct default values
  (payment_status = 'pending' OR payment_status IS NULL) AND
  (registration_status = 'pending' OR registration_status IS NULL)
);