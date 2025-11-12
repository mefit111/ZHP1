/*
  # Update All Camps to Przebrno Location
  
  1. Changes
    - Updates all existing camps to have Przebrno as their location
    - Updates camp names to reflect Przebrno location
    
  2. Security
    - Maintains existing RLS policies
    - No additional security required
*/

BEGIN;

-- Update all camp locations to Przebrno
UPDATE public.camps SET location = 'Przebrno';

-- Update camp names to reflect Przebrno location
UPDATE public.camps 
SET name = CASE
    WHEN name LIKE '%MAŁE CICHE%' THEN REPLACE(name, 'MAŁE CICHE', 'PRZEBRNIE')
    WHEN name LIKE '%ZAKOPANEM%' THEN REPLACE(name, 'ZAKOPANEM', 'PRZEBRNIE')
    WHEN name LIKE '%BIESZCZADACH%' THEN REPLACE(name, 'BIESZCZADACH', 'PRZEBRNIE')
    ELSE name
END
WHERE name NOT LIKE '%PRZEBRNIE%';

COMMIT;