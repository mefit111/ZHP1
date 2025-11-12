/*
  # Fix registrations RLS policies

  1. Changes
    - Remove overly restrictive checks from public registration policy
    - Simplify the policy to only check camp capacity
    - Keep basic validation for payment and registration status
  
  2. Security
    - Maintains RLS protection while allowing valid registrations
    - Ensures registrations can't exceed camp capacity
    - Preserves admin management capabilities
*/

-- Drop the existing overly restrictive policy
DROP POLICY IF EXISTS "Allow public registration submissions" ON registrations;

-- Create new simplified policy for public registrations
CREATE POLICY "Allow public registration submissions" ON registrations
FOR INSERT TO public
WITH CHECK (
  -- Check if camp has available capacity
  EXISTS (
    SELECT 1 FROM camps c
    WHERE c.id = camp_id 
    AND (
      SELECT count(*) 
      FROM registrations r 
      WHERE r.camp_id = c.id 
      AND r.registration_status != 'cancelled'
    ) < c.capacity
  )
  -- Ensure initial status values
  AND payment_status = 'pending'
  AND registration_status = 'pending'
);