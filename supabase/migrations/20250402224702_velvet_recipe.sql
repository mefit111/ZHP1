/*
  # Update Admin Password
  
  Updates the password for user poztech2019@gmail.com to ZHPadmin2025
*/

BEGIN;

-- Update password for specific user
UPDATE auth.users 
SET encrypted_password = crypt('ZHPadmin2025', gen_salt('bf'))
WHERE email = 'poztech2019@gmail.com';

COMMIT;