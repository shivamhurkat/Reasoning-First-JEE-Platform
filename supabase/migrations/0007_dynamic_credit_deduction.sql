-- 1. Update deduct_credit to take an amount parameter
CREATE OR REPLACE FUNCTION public.deduct_credit(p_user_id uuid, p_amount integer DEFAULT 1)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_balance integer;
BEGIN
  UPDATE public.user_profiles
  SET credit_balance = credit_balance - p_amount
  WHERE id = p_user_id
    AND credit_balance >= p_amount
  RETURNING credit_balance INTO v_new_balance;

  IF NOT FOUND THEN
    RETURN false;  -- balance was not enough or user not found
  END IF;

  -- Log the deduction
  INSERT INTO public.credit_transactions
    (user_id, type, amount, balance_after, description)
  VALUES
    (p_user_id, 'question_attempt', -p_amount, v_new_balance, 'Question attempt');

  RETURN true;
END;
$$;
