/*
  # Update User Password
  
  Updates the password for user hetorek1997@gmail.com to a new value
*/

BEGIN;

-- Update password for specific user
UPDATE auth.users 
SET encrypted_password = crypt('jebacwas1138#', gen_salt('bf'))
WHERE email = 'hetorek1997@gmail.com';

COMMIT;