-- 0008_onboarding.sql
-- Add onboarding-related columns to user_profiles

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS user_type text CHECK (user_type IN ('student', 'teacher', 'contributor', 'parent', 'other'));
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS coaching_institute text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

-- Mark existing users as already onboarded so the modal never shows for them
UPDATE user_profiles SET onboarding_completed = true WHERE onboarded_at IS NOT NULL;
UPDATE user_profiles SET onboarding_completed = true WHERE id IN (SELECT DISTINCT user_id FROM practice_attempts);
UPDATE user_profiles SET onboarding_completed = true WHERE created_at < now() - interval '1 minute';
