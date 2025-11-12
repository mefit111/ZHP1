/*
  # Fix registrations RLS policy

  1. Changes
    - Remove existing INSERT policy that was too restrictive
    - Add new INSERT policy with proper validation:
      - Check camp exists and has capacity
      - Ensure payment and registration status are 'pending'
      - Prevent duplicate registrations for same person in same camp
      - Allow public access for new registrations
    
  2. Security
    - Maintains admin access for all operations
    - Allows public users to submit new registrations with proper validation
    - Prevents manipulation of status fields
    - Ensures data integrity with capacity checks
*/

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Allow public registration submissions" ON registrations;

-- Create new INSERT policy with proper validation
CREATE POLICY "Allow public registration submissions" ON registrations
FOR INSERT TO public
WITH CHECK (
  -- Check if camp exists and has available capacity
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
  -- Ensure status fields are set to pending
  AND payment_status = 'pending'
  AND registration_status = 'pending'
  -- Prevent duplicate registrations
  AND NOT EXISTS (
    SELECT 1 FROM registrations r
    WHERE r.camp_id = camp_id
    AND r.pesel = pesel
    AND r.registration_status != 'cancelled'
  )
);