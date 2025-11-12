/*
  # Update Camps Data
  
  1. Changes
    - Update existing camps to match new requirements
    - Set proper durations and types
    - Ensure all camps are in Przebrno
    
  2. Security
    - Maintains existing RLS policies
    - No additional security required
*/

BEGIN;

-- First, delete all existing camps
DELETE FROM public.camps;

-- Insert new camps with specified requirements
INSERT INTO public.camps (
  name,
  type,
  location,
  start_date,
  end_date,
  price,
  capacity
) VALUES
-- 12-day regular camp
(
  'Obóz w Przebrnie - I Turnus',
  'turnus',
  'Przebrno',
  '2025-07-01',
  '2025-07-12',
  2499,
  50
),
-- 12-day hotel stay
(
  'Hotelik w Przebrnie - I Turnus',
  'hotelik',
  'Przebrno',
  '2025-07-15',
  '2025-07-26',
  2699,
  30
),
-- 8-day gathering
(
  'Zlot w Przebrnie',
  'zlot',
  'Przebrno',
  '2025-07-29',
  '2025-08-05',
  1899,
  100
),
-- Colony in Małe Ciche
(
  'Kolonia w Małe Ciche',
  'turnus',
  'Małe Ciche',
  '2025-07-04',
  '2025-07-14',
  2299,
  50
);

COMMIT;