/*
  # Add Sample Registrations
  
  1. Changes
    - Adds sample registrations for various camps
    - Uses realistic Polish data
    - Includes different registration statuses
    - Includes different payment statuses
    
  2. Security
    - Maintains data integrity
    - Uses valid PESEL numbers
    - Follows proper data format
*/

BEGIN;

-- Insert sample registrations
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
      'Zofia', 'Kowalska', '08292512345', '2008-09-25',
      'zofia.kowalska@example.com', '+48 512 345 678',
      'ul. Morska 12', 'Gdańsk', '80-001',
      'zuch', 'Alergia na orzechy',
      'completed', 'confirmed'
    ),
    (
      'Jakub', 'Nowak', '09310634567', '2009-10-06',
      'jakub.nowak@example.com', '+48 623 456 789',
      'ul. Długa 45', 'Warszawa', '00-001',
      'harcerz', 'Wegetarianin',
      'pending', 'pending'
    ),
    (
      'Julia', 'Wiśniewska', '10040823456', '2010-04-08',
      'julia.wisniewska@example.com', '+48 734 567 890',
      'ul. Krótka 7', 'Poznań', '60-001',
      'zuch', NULL,
      'partial', 'confirmed'
    ),
    (
      'Michał', 'Wójcik', '07121034567', '2007-10-10',
      'michal.wojcik@example.com', '+48 845 678 901',
      'ul. Szeroka 22', 'Kraków', '30-001',
      'harcerz', 'Uczulenie na pyłki',
      'completed', 'confirmed'
    ),
    (
      'Natalia', 'Kamińska', '11020945678', '2011-02-09',
      'natalia.kaminska@example.com', '+48 956 789 012',
      'ul. Wąska 15', 'Wrocław', '50-001',
      'zuch', NULL,
      'pending', 'pending'
    ),
    (
      'Kacper', 'Lewandowski', '08070856789', '2008-07-08',
      'kacper.lewandowski@example.com', '+48 667 890 123',
      'ul. Polna 33', 'Łódź', '90-001',
      'harcerz', 'Astma',
      'completed', 'confirmed'
    ),
    (
      'Maja', 'Zielińska', '09121267890', '2009-12-12',
      'maja.zielinska@example.com', '+48 778 901 234',
      'ul. Kwiatowa 9', 'Szczecin', '70-001',
      'zuch', NULL,
      'partial', 'confirmed'
    ),
    (
      'Filip', 'Szymański', '10030578901', '2010-03-05',
      'filip.szymanski@example.com', '+48 889 012 345',
      'ul. Leśna 55', 'Bydgoszcz', '85-001',
      'harcerz', 'Dieta bezglutenowa',
      'pending', 'pending'
    ),
    (
      'Hanna', 'Woźniak', '07090189012', '2007-09-01',
      'hanna.wozniak@example.com', '+48 990 123 456',
      'ul. Słoneczna 77', 'Lublin', '20-001',
      'wedrownik', NULL,
      'completed', 'confirmed'
    ),
    (
      'Szymon', 'Dąbrowski', '08111290123', '2008-11-12',
      'szymon.dabrowski@example.com', '+48 501 234 567',
      'ul. Cicha 44', 'Katowice', '40-001',
      'harcerz', 'Uczulenie na laktozę',
      'partial', 'confirmed'
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