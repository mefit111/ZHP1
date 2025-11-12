/*
  # Add Location Field to Camps Table
  
  1. Changes
    - Add location field to camps table
    - Update existing camps with default locations
    
  2. Security
    - Maintains existing RLS policies
    - No additional security required as camps table is already admin-protected
*/

BEGIN;

-- Add location column
ALTER TABLE public.camps ADD COLUMN IF NOT EXISTS location text NOT NULL DEFAULT 'Przebrno';

-- Update existing camps with proper locations
UPDATE public.camps 
SET location = 
  CASE 
    WHEN name LIKE '%PRZEBRNIE%' THEN 'Przebrno'
    WHEN name LIKE '%MAŁE CICHE%' OR name LIKE '%ZAKOPANEM%' THEN 'Małe Ciche'
    WHEN name LIKE '%BIESZCZAD%' THEN 'Bieszczady'
    ELSE location
  END;

COMMIT;