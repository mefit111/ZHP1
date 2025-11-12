/*
  # Add Camp Type Field
  
  1. Changes
    - Add type field to camps table
    - Update existing camps with default type
    - Add check constraint for valid types
    
  2. Security
    - Maintains existing RLS policies
    - Ensures data integrity with constraint
*/

BEGIN;

-- Add type column to camps table
ALTER TABLE public.camps 
ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'turnus'
CHECK (type IN ('hotelik', 'zlot', 'turnus'));

-- Update existing camps with appropriate types based on their names
UPDATE public.camps 
SET type = 
  CASE 
    WHEN name ILIKE '%HOTELIK%' THEN 'hotelik'
    WHEN name ILIKE '%ZLOT%' THEN 'zlot'
    ELSE 'turnus'
  END;

COMMIT;