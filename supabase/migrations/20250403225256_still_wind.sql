/*
  # Fix Registration RLS Policies

  1. Changes
    - Simplify the registration submission policy for public users
    - Fix the policy conditions to properly handle initial submissions
    - Ensure basic validation checks are maintained
    
  2. Security
    - Maintain capacity check
    - Prevent duplicate registrations
    - Ensure only pending status can be set on creation
*/

-- Drop the existing policy
DROP POLICY IF EXISTS "Allow public registration submissions" ON registrations;

-- Create new simplified policy for public registration submissions
CREATE POLICY "Allow public registration submissions" ON registrations
FOR INSERT TO public
WITH CHECK (
  -- Check if the camp exists and has capacity
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
  -- Ensure only pending status is set
  AND payment_status = 'pending'
  AND registration_status = 'pending'
  -- Prevent duplicate registrations for the same person in the same camp
  AND NOT EXISTS (
    SELECT 1 FROM registrations existing
    WHERE existing.camp_id = camp_id
    AND existing.pesel = pesel
    AND existing.registration_status != 'cancelled'
  )
);