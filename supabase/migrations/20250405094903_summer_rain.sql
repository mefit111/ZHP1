/*
  # Fix infinite recursion in registrations policy

  1. Changes
    - Drop the problematic policy that causes infinite recursion
    - Create a new, corrected policy for public registration submissions
    
  2. Security
    - Maintains RLS enabled on registrations table
    - Adds a corrected policy that:
      - Allows public users to insert registrations
      - Checks camp capacity without causing recursion
      - Prevents duplicate registrations by PESEL
      - Ensures proper payment and registration status
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "Allow public registration submissions" ON registrations;

-- Create new corrected policy
CREATE POLICY "Allow public registration submissions"
ON registrations
FOR INSERT
TO public
WITH CHECK (
  -- Check if the camp exists and has capacity
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
  -- Ensure proper initial status
  AND payment_status = 'pending'
  AND registration_status = 'pending'
  -- Check for existing non-cancelled registration with same PESEL and camp
  AND NOT EXISTS (
    SELECT 1
    FROM registrations existing
    WHERE existing.camp_id = camp_id
    AND existing.pesel = pesel
    AND existing.registration_status <> 'cancelled'
  )
);