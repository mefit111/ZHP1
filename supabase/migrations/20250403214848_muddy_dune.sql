/*
  # Fix registrations RLS policy

  1. Changes
    - Fix the RLS policy for public registration submissions
    - Simplify the policy conditions to make them more reliable
    - Fix the camp capacity check logic
    - Fix the duplicate registration check

  2. Security
    - Maintain security by ensuring:
      - Only pending registrations can be submitted
      - No duplicate registrations per camp/PESEL
      - Camp capacity is not exceeded
*/

-- Drop the existing policy
DROP POLICY IF EXISTS "Allow public registration submissions" ON registrations;

-- Create new policy with fixed conditions
CREATE POLICY "Allow public registration submissions" ON registrations
FOR INSERT
TO public
WITH CHECK (
  -- Ensure the camp exists and has capacity
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
  -- Ensure payment and registration status are pending
  AND payment_status = 'pending'
  AND registration_status = 'pending'
  -- Check for no existing non-cancelled registration for same person in same camp
  AND NOT EXISTS (
    SELECT 1 FROM registrations r
    WHERE r.camp_id = camp_id
    AND r.pesel = pesel
    AND r.registration_status != 'cancelled'
  )
);