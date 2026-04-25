-- Fix handle_new_user trigger: capture full_name from Google OAuth metadata.
-- Google supplies the user's name in raw_user_meta_data under 'full_name' or 'name'.
-- Previously the trigger only inserted (id, email), leaving full_name NULL for OAuth users.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      NULL
    )
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allow 'other' as a valid target_exam value (for students targeting other exams).
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_target_exam_check;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_target_exam_check
  CHECK (target_exam IN ('jee_mains', 'jee_advanced', 'neet', 'other'));
