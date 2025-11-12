/*
  # Add Payment Amount Tracking
  
  1. Changes
    - Add paid_amount column to registrations table
    - Update payment_status based on paid_amount vs total price
    - Add function to automatically update payment_status
    
  2. Security
    - Maintains existing RLS policies
    - Ensures data integrity
*/

BEGIN;

-- Add paid_amount column to registrations
ALTER TABLE public.registrations 
ADD COLUMN IF NOT EXISTS paid_amount numeric DEFAULT 0;

-- Create function to update payment_status based on paid_amount
CREATE OR REPLACE FUNCTION update_payment_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Get the camp price
  DECLARE
    camp_price numeric;
  BEGIN
    SELECT price INTO camp_price
    FROM camps
    WHERE id = NEW.camp_id;

    -- Update payment_status based on paid amount
    IF NEW.paid_amount >= camp_price THEN
      NEW.payment_status := 'completed';
    ELSIF NEW.paid_amount > 0 THEN
      NEW.payment_status := 'partial';
    ELSE
      NEW.payment_status := 'pending';
    END IF;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update payment_status
DROP TRIGGER IF EXISTS update_payment_status_trigger ON registrations;
CREATE TRIGGER update_payment_status_trigger
  BEFORE UPDATE OF paid_amount
  ON registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_status();

COMMIT;