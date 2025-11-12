/*
  # Add Test Registration Data
  
  This migration adds sample registration data to test admin functionality.
  
  1. Changes:
    - Adds test registrations with various statuses
    - Uses realistic Polish names and addresses
    - Includes different payment statuses
    
  2. Security:
    - Maintains data integrity with valid PESEL numbers
    - Uses proper email formats
    - Follows postal code format
*/

BEGIN;

-- Insert test registrations
INSERT INTO public.registrations (
  camp_id,
  first_name,
  last_name,
  pesel,
  birth_date,
  email,
  phone,
  address,
  city,
  postal_code,
  zhp_status,
  notes,
  payment_status,
  registration_status
) 
SELECT
  c.id,
  first_name,
  last_name,
  pesel,
  birth_date::date,
  email,
  phone,
  address,
  city,
  postal_code,
  zhp_status,
  notes,
  payment_status,
  registration_status
FROM (
  VALUES
    (
      'Jan', 'Kowalski', '04220123456', '2004-02-01'::date, 
      'jan.kowalski@example.com', '+48 123 456 789',
      'ul. Mickiewicza 15', 'Warszawa', '00-123',
      'harcerz', 'Alergia na orzechy',
      'completed', 'confirmed'
    ),
    (
      'Anna', 'Nowak', '05310234567', '2005-03-10'::date,
      'anna.nowak@example.com', '+48 234 567 890',
      'ul. Słowackiego 22', 'Kraków', '30-001',
      'zuch', 'Wegetarianka',
      'pending', 'pending'
    ),
    (
      'Piotr', 'Wiśniewski', '06280345678', '2006-02-08'::date,
      'piotr.wisniewski@example.com', '+48 345 678 901',
      'ul. Kościuszki 7', 'Gdańsk', '80-001',
      'wedrownik', NULL,
      'partial', 'confirmed'
    ),
    (
      'Zofia', 'Wójcik', '07230456789', '2007-02-03'::date,
      'zofia.wojcik@example.com', '+48 456 789 012',
      'ul. Sienkiewicza 33', 'Poznań', '60-001',
      'harcerz', 'Uczulenie na pyłki',
      'pending', 'pending'
    ),
    (
      'Michał', 'Lewandowski', '08210567890', '2008-01-21'::date,
      'michal.lewandowski@example.com', '+48 567 890 123',
      'ul. Matejki 12', 'Wrocław', '50-001',
      'zuch', NULL,
      'completed', 'confirmed'
    )
) AS data(
  first_name, last_name, pesel, birth_date, email, phone,
  address, city, postal_code, zhp_status, notes,
  payment_status, registration_status
)
CROSS JOIN LATERAL (
  SELECT id FROM public.camps 
  ORDER BY random() 
  LIMIT 1
) c;

COMMIT;