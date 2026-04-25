-- Drop the NOT NULL constraint on full_name so the handle_new_user() trigger
-- (which inserts only id + email) does not fail on signup.
-- The signup handler updates full_name immediately after auth.signUp succeeds.
ALTER TABLE user_profiles ALTER COLUMN full_name DROP NOT NULL;
