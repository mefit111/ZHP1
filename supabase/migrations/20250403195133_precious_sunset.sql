/*
  # Fix registrations table RLS policies

  1. Changes
    - Remove existing INSERT policy that was too permissive
    - Add new INSERT policy with proper security checks:
      - Ensures valid camp_id
      - Ensures camp has available capacity
      - Sets default statuses
    
  2. Security
    - Maintains existing admin policies
    - Adds proper INSERT policy for public registrations
    - Prevents registration spam through capacity checks
*/

-- First remove the overly permissive policy
DROP POLICY IF EXISTS "Registrations can be created by anyone" ON registrations;

-- Add new INSERT policy with proper checks
CREATE POLICY "Allow public registration submissions" ON registrations
FOR INSERT TO public
WITH CHECK (
  -- Ensure camp_id exists and camp has available capacity
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
  -- Ensure default statuses
  AND payment_status = 'pending'
  AND registration_status = 'pending'
);