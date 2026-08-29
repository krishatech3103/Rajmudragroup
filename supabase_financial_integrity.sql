-- ====================================================================
-- RAJMUDRA FINANCIAL INTEGRITY
-- ====================================================================
-- Run this AFTER supabase_auth_rls.sql and the existing payment-mode and
-- bank-holder migrations. It is safe to run repeatedly and does not change
-- or delete existing financial entries.
--
-- It makes the important no-negative-balance rules database-enforced. This
-- means two devices, a stale browser, or a direct authenticated API request
-- cannot spend or transfer more Cash, UPI, or Bank/FD money than exists.
-- ====================================================================

-- New records must always have positive amounts. NOT VALID preserves any old
-- historical rows while enforcing the rule for every future insert or update.
ALTER TABLE public.vargani DROP CONSTRAINT IF EXISTS vargani_amount_positive;
ALTER TABLE public.vargani ADD CONSTRAINT vargani_amount_positive CHECK (amount > 0) NOT VALID;
ALTER TABLE public.jama DROP CONSTRAINT IF EXISTS jama_amount_positive;
ALTER TABLE public.jama ADD CONSTRAINT jama_amount_positive CHECK (amount > 0) NOT VALID;
ALTER TABLE public.kharch DROP CONSTRAINT IF EXISTS kharch_amount_positive;
ALTER TABLE public.kharch ADD CONSTRAINT kharch_amount_positive CHECK (amount > 0) NOT VALID;
ALTER TABLE public.bank_fd DROP CONSTRAINT IF EXISTS bank_fd_amount_positive;
ALTER TABLE public.bank_fd ADD CONSTRAINT bank_fd_amount_positive CHECK (amount > 0) NOT VALID;

-- Keep payment modes compatible with existing records while rejecting typos
-- that would otherwise silently be counted as UPI/Online.
ALTER TABLE public.vargani DROP CONSTRAINT IF EXISTS vargani_payment_mode_valid;
ALTER TABLE public.vargani ADD CONSTRAINT vargani_payment_mode_valid
  CHECK (BTRIM(payment_mode) IN ('Cash', 'UPI', 'Online')) NOT VALID;
ALTER TABLE public.jama DROP CONSTRAINT IF EXISTS jama_payment_mode_valid;
ALTER TABLE public.jama ADD CONSTRAINT jama_payment_mode_valid
  CHECK (BTRIM(payment_mode) IN ('Cash', 'UPI', 'Online')) NOT VALID;
ALTER TABLE public.kharch DROP CONSTRAINT IF EXISTS kharch_payment_mode_valid;
ALTER TABLE public.kharch ADD CONSTRAINT kharch_payment_mode_valid
  CHECK (BTRIM(payment_mode) IN ('Cash', 'UPI', 'Online')) NOT VALID;

ALTER TABLE public.vargani DROP CONSTRAINT IF EXISTS vargani_status_valid;
ALTER TABLE public.vargani ADD CONSTRAINT vargani_status_valid
  CHECK (status IN ('paid', 'pending')) NOT VALID;
ALTER TABLE public.bank_fd DROP CONSTRAINT IF EXISTS bank_fd_type_valid;
ALTER TABLE public.bank_fd ADD CONSTRAINT bank_fd_type_valid CHECK (type IN (
  'deposit', 'renew', 'interest', 'withdrawal', 'fd_expense', 'charge',
  'cash_to_upi', 'upi_to_cash', 'cash_to_bank', 'upi_to_bank',
  'bank_to_cash', 'bank_to_upi', 'bank_income', 'bank_expense'
)) NOT VALID;

-- Returns the Cash and online balances for one festival year, excluding an
-- edited expense or bank movement when supplied. Pending donations never add
-- money to either balance.
CREATE OR REPLACE FUNCTION public.rajmudra_treasury_balances(
  p_year TEXT,
  p_exclude_kharch_id BIGINT DEFAULT NULL,
  p_exclude_bank_fd_id BIGINT DEFAULT NULL
)
RETURNS TABLE (cash_balance NUMERIC, online_balance NUMERIC)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH income AS (
    SELECT payment_mode, amount
    FROM public.vargani
    WHERE year = p_year AND COALESCE(status, 'paid') = 'paid'
    UNION ALL
    SELECT payment_mode, amount
    FROM public.jama
    WHERE year = p_year
  ), expenses AS (
    SELECT payment_mode, amount
    FROM public.kharch
    WHERE year = p_year
      AND (p_exclude_kharch_id IS NULL OR id <> p_exclude_kharch_id)
  ), movements AS (
    SELECT type, amount
    FROM public.bank_fd
    WHERE year = p_year
      AND (p_exclude_bank_fd_id IS NULL OR id <> p_exclude_bank_fd_id)
  )
  SELECT
    COALESCE((SELECT SUM(CASE WHEN LOWER(BTRIM(COALESCE(payment_mode, 'Cash'))) = 'cash' THEN amount ELSE 0 END) FROM income), 0)
      - COALESCE((SELECT SUM(CASE WHEN LOWER(BTRIM(COALESCE(payment_mode, 'Cash'))) = 'cash' THEN amount ELSE 0 END) FROM expenses), 0)
      + COALESCE((SELECT SUM(CASE
          WHEN type IN ('upi_to_cash', 'bank_to_cash') THEN amount
          WHEN type IN ('cash_to_upi', 'cash_to_bank') THEN -amount
          ELSE 0 END) FROM movements), 0),
    COALESCE((SELECT SUM(CASE WHEN LOWER(BTRIM(COALESCE(payment_mode, 'Cash'))) <> 'cash' THEN amount ELSE 0 END) FROM income), 0)
      - COALESCE((SELECT SUM(CASE WHEN LOWER(BTRIM(COALESCE(payment_mode, 'Cash'))) <> 'cash' THEN amount ELSE 0 END) FROM expenses), 0)
      + COALESCE((SELECT SUM(CASE
          WHEN type IN ('cash_to_upi', 'bank_to_upi') THEN amount
          WHEN type IN ('upi_to_cash', 'upi_to_bank') THEN -amount
          ELSE 0 END) FROM movements), 0);
$$;

-- Returns the all-time Bank/FD balance, excluding one row while it is edited.
CREATE OR REPLACE FUNCTION public.rajmudra_bank_balance(p_exclude_bank_fd_id BIGINT DEFAULT NULL)
RETURNS NUMERIC
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(SUM(CASE
    WHEN type IN ('deposit', 'renew', 'cash_to_bank', 'upi_to_bank', 'interest', 'bank_income') THEN amount
    WHEN type IN ('withdrawal', 'bank_to_cash', 'bank_to_upi', 'fd_expense', 'charge', 'bank_expense') THEN -amount
    ELSE 0
  END), 0)
  FROM public.bank_fd
  WHERE p_exclude_bank_fd_id IS NULL OR id <> p_exclude_bank_fd_id;
$$;

-- These helpers are internal validation functions, not public API endpoints.
REVOKE ALL ON FUNCTION public.rajmudra_treasury_balances(TEXT, BIGINT, BIGINT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rajmudra_bank_balance(BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rajmudra_treasury_balances(TEXT, BIGINT, BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rajmudra_bank_balance(BIGINT) TO authenticated;

CREATE OR REPLACE FUNCTION public.rajmudra_validate_expense_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  balances RECORD;
  available NUMERIC;
  old_id BIGINT := NULL;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    old_id := OLD.id;
  END IF;

  -- One lock per year makes simultaneous Cash/UPI spending deterministic.
  PERFORM pg_advisory_xact_lock(hashtext('rajmudra:treasury:' || NEW.year));
  SELECT * INTO balances
  FROM public.rajmudra_treasury_balances(
    NEW.year,
    old_id,
    NULL
  );

  available := CASE
    WHEN LOWER(BTRIM(COALESCE(NEW.payment_mode, 'Cash'))) = 'cash' THEN balances.cash_balance
    ELSE balances.online_balance
  END;

  IF NEW.amount > available THEN
    RAISE EXCEPTION 'Insufficient % balance. Available: Rs. %', NEW.payment_mode, available
      USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.rajmudra_validate_bank_entry_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  balances RECORD;
  available NUMERIC;
  bank_before NUMERIC;
  bank_after NUMERIC;
  old_id BIGINT := NULL;
  bank_delta NUMERIC := 0;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    old_id := OLD.id;
  END IF;

  -- Bank entries share one all-time balance, irrespective of festival year.
  PERFORM pg_advisory_xact_lock(hashtext('rajmudra:bank'));
  PERFORM pg_advisory_xact_lock(hashtext('rajmudra:treasury:' || NEW.year));

  -- A transfer must have enough money in the exact source fund.
  IF NEW.type IN ('cash_to_upi', 'cash_to_bank', 'upi_to_cash', 'upi_to_bank') THEN
    SELECT * INTO balances
    FROM public.rajmudra_treasury_balances(NEW.year, NULL, old_id);
    available := CASE
      WHEN NEW.type IN ('cash_to_upi', 'cash_to_bank') THEN balances.cash_balance
      ELSE balances.online_balance
    END;
    IF NEW.amount > available THEN
      RAISE EXCEPTION 'Insufficient source balance for %. Available: Rs. %', NEW.type, available
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  -- Calculate the all-time Bank/FD result after this exact row is saved.
  bank_before := public.rajmudra_bank_balance(old_id);
  bank_delta := CASE
    WHEN NEW.type IN ('deposit', 'renew', 'cash_to_bank', 'upi_to_bank', 'interest', 'bank_income') THEN NEW.amount
    WHEN NEW.type IN ('withdrawal', 'bank_to_cash', 'bank_to_upi', 'fd_expense', 'charge', 'bank_expense') THEN -NEW.amount
    ELSE 0
  END;
  bank_after := bank_before + bank_delta;

  IF bank_after < 0 THEN
    RAISE EXCEPTION 'Insufficient Bank / FD balance. Available: Rs. %', bank_before
      USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_kharch_balance ON public.kharch;
CREATE TRIGGER validate_kharch_balance
BEFORE INSERT OR UPDATE OF amount, payment_mode, year ON public.kharch
FOR EACH ROW EXECUTE FUNCTION public.rajmudra_validate_expense_balance();

DROP TRIGGER IF EXISTS validate_bank_fd_balance ON public.bank_fd;
CREATE TRIGGER validate_bank_fd_balance
BEFORE INSERT OR UPDATE OF amount, type, year ON public.bank_fd
FOR EACH ROW EXECUTE FUNCTION public.rajmudra_validate_bank_entry_balance();

-- The data API normally reloads automatically; notify it explicitly here.
NOTIFY pgrst, 'reload schema';
