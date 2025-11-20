-- Add 'admin' to the user_type check constraint in profiles table

-- Drop the existing check constraint
ALTER TABLE profiles DROP CONSTRAINT profiles_user_type_check;

-- Add the new check constraint including 'admin'
ALTER TABLE profiles ADD CONSTRAINT profiles_user_type_check CHECK (user_type IN ('artist', 'user', 'admin'));
