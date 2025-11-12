/*
  # Revert Camps Changes
  
  1. Changes
    - Delete all existing camps
    - Restore original camps data with proper locations
    
  2. Security
    - Maintains existing RLS policies
    - No additional security required
*/

BEGIN;

-- First, delete all existing camps
DELETE FROM public.camps;

-- Insert original camps data
INSERT INTO public.camps (
  name,
  type,
  location,
  start_date,
  end_date,
  price,
  capacity
) VALUES
(
  'ZIMOWISKO W MAŁE CICHE',
  'turnus',
  'Małe Ciche',
  '2025-01-20',
  '2025-01-27',
  1899,
  45
),
(
  'OBÓZ NARCIARSKI W ZAKOPANEM',
  'turnus',
  'Zakopane',
  '2025-02-10',
  '2025-02-17',
  2199,
  40
),
(
  'OBÓZ ŻEGLARSKI W PRZEBRNIE',
  'turnus',
  'Przebrno',
  '2025-07-01',
  '2025-07-14',
  2899,
  30
),
(
  'OBÓZ W PRZEBRNIE',
  'turnus',
  'Przebrno',
  '2025-07-15',
  '2025-07-28',
  2499,
  60
),
(
  'OBÓZ SURVIVALOWY W BIESZCZADACH',
  'turnus',
  'Bieszczady',
  '2025-07-20',
  '2025-08-02',
  2699,
  25
),
(
  'KOLONIA W MAŁE CICHE',
  'turnus',
  'Małe Ciche',
  '2025-08-01',
  '2025-08-14',
  2299,
  50
),
(
  'OBÓZ JĘZYKOWY W MAŁE CICHE',
  'turnus',
  'Małe Ciche',
  '2025-08-16',
  '2025-08-29',
  2599,
  35
),
(
  'OBÓZ WSPINACZKOWY W TATRACH',
  'turnus',
  'Zakopane',
  '2025-08-20',
  '2025-08-31',
  2799,
  20
);

COMMIT;