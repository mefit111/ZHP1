/*
  # Fix registrations RLS policy

  1. Changes
    - Drop and recreate the public registration policy to fix the RLS violation
    - Ensure proper conditions for new registrations:
      - Camp must exist and have available capacity
      - Initial status must be pending
      - One registration per PESEL per camp

  2. Security
    - Maintains existing security constraints
    - Ensures data integrity
    - Prevents duplicate registrations
*/

-- Drop the existing policy
DROP POLICY IF EXISTS "Allow public registration submissions" ON registrations;

-- Create the updated policy
CREATE POLICY "Allow public registration submissions" ON registrations
FOR INSERT TO public
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
  -- Status must be pending
  AND payment_status = 'pending'
  AND registration_status = 'pending'
  -- Prevent duplicate registrations for the same person in the same camp
  AND NOT EXISTS (
    SELECT 1 FROM registrations r
    WHERE r.camp_id = camp_id
    AND r.pesel = pesel
    AND r.registration_status <> 'cancelled'
  )
);