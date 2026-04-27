-- Migration 0006: Credits, referrals, and admin config
-- Safe to run multiple times (IF NOT EXISTS guards throughout)

-- 1. Add credit columns to user_profiles (skip if already added)
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS credit_balance         integer     NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS lifetime_credits_purchased integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referral_code          text        UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by            uuid        REFERENCES public.user_profiles(id),
  ADD COLUMN IF NOT EXISTS plan                   text        NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free','pro')),
  ADD COLUMN IF NOT EXISTS plan_expires_at        timestamptz,
  ADD COLUMN IF NOT EXISTS credits_last_refreshed_at timestamptz;

-- 2. credit_transactions ledger
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id                     uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                uuid        NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  type                   text        NOT NULL
    CHECK (type IN ('question_attempt','purchase','pro_signup','referral_bonus','monthly_refresh','signup_bonus','manual_adjustment')),
  amount                 integer     NOT NULL,                 -- negative for deductions
  balance_after          integer     NOT NULL,
  description            text,
  payment_transaction_id uuid        REFERENCES public.payment_transactions(id),
  created_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS credit_transactions_user_id_idx ON public.credit_transactions(user_id);

-- 3. referrals table
CREATE TABLE IF NOT EXISTS public.referrals (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id     uuid        NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  referred_id     uuid        NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  credits_awarded integer     NOT NULL DEFAULT 50,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(referred_id)   -- each user can only be referred once
);

-- 4. admin_config key-value store
CREATE TABLE IF NOT EXISTS public.admin_config (
  key        text PRIMARY KEY,
  value      jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Seed admin_config (upsert so re-runs are safe)
INSERT INTO public.admin_config (key, value) VALUES
  ('credit_costs',    '{"question_attempt": 1, "hint": 0}'::jsonb),
  ('free_tier',       '{"monthly_credits": 10, "signup_bonus_credits": 10}'::jsonb),
  ('pro_tier',        '{"monthly_credits": 1000, "price_inr": 99}'::jsonb),
  ('topup_packages',  '[{"credits":50,"price_inr":29},{"credits":100,"price_inr":49},{"credits":250,"price_inr":99},{"credits":500,"price_inr":179}]'::jsonb),
  ('referral',        '{"bonus_credits": 50, "enabled": true}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 6. RLS policies
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_config        ENABLE ROW LEVEL SECURITY;

-- Users can read their own transactions
DROP POLICY IF EXISTS "users read own credit_transactions"  ON public.credit_transactions;
CREATE POLICY "users read own credit_transactions"
  ON public.credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Service role writes credit_transactions (via server actions / API routes)
DROP POLICY IF EXISTS "service role manages credit_transactions" ON public.credit_transactions;
CREATE POLICY "service role manages credit_transactions"
  ON public.credit_transactions FOR ALL
  USING (auth.role() = 'service_role');

-- Users read their own referral rows
DROP POLICY IF EXISTS "users read own referrals" ON public.referrals;
CREATE POLICY "users read own referrals"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- Service role manages referrals
DROP POLICY IF EXISTS "service role manages referrals" ON public.referrals;
CREATE POLICY "service role manages referrals"
  ON public.referrals FOR ALL
  USING (auth.role() = 'service_role');

-- admin_config: readable by all authenticated users
DROP POLICY IF EXISTS "authenticated read admin_config" ON public.admin_config;
CREATE POLICY "authenticated read admin_config"
  ON public.admin_config FOR SELECT
  USING (auth.role() = 'authenticated');

-- admin_config: writable only by service role / admins
DROP POLICY IF EXISTS "service role manages admin_config" ON public.admin_config;
CREATE POLICY "service role manages admin_config"
  ON public.admin_config FOR ALL
  USING (auth.role() = 'service_role');

-- 7. Atomic credit deduction function (prevents race conditions)
CREATE OR REPLACE FUNCTION public.deduct_credit(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_balance integer;
BEGIN
  UPDATE public.user_profiles
  SET credit_balance = credit_balance - 1
  WHERE id = p_user_id
    AND credit_balance > 0
  RETURNING credit_balance INTO v_new_balance;

  IF NOT FOUND THEN
    RETURN false;  -- balance was 0 or user not found
  END IF;

  -- Log the deduction
  INSERT INTO public.credit_transactions
    (user_id, type, amount, balance_after, description)
  VALUES
    (p_user_id, 'question_attempt', -1, v_new_balance, 'Question attempt');

  RETURN true;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.deduct_credit(uuid) TO authenticated;

-- 8. Update handle_new_user trigger to assign a referral code and signup bonus
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_referral_code text;
BEGIN
  -- Generate a unique referral code: 8 chars from user_id without hyphens
  v_referral_code := upper(substring(replace(NEW.id::text, '-', ''), 1, 8));

  INSERT INTO public.user_profiles (
    id,
    email,
    full_name,
    role,
    credit_balance,
    referral_code
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name'
    ),
    'student',
    10,   -- signup bonus
    v_referral_code
  )
  ON CONFLICT (id) DO UPDATE
    SET
      email      = EXCLUDED.email,
      full_name  = COALESCE(EXCLUDED.full_name, public.user_profiles.full_name),
      referral_code = COALESCE(public.user_profiles.referral_code, EXCLUDED.referral_code);

  RETURN NEW;
END;
$$;
