-- ====================================================================
-- RAJMUDRA SIMPLIFIED FD RENEWAL
-- ====================================================================
-- Run this AFTER supabase_financial_integrity.sql.
--
-- A renewed FD replaces its old FD with one final renewed amount. Enter the
-- renewed total including credited interest; do not create a separate
-- interest record. This prevents the old principal being double-counted.
-- ====================================================================

ALTER TABLE public.bank_fd
ADD COLUMN IF NOT EXISTS renewed_from_id BIGINT REFERENCES public.bank_fd(id);

CREATE INDEX IF NOT EXISTS idx_bank_fd_renewed_from_id
ON public.bank_fd(renewed_from_id)
WHERE renewed_from_id IS NOT NULL;

-- Replaces the financial-integrity helper with renewal-aware arithmetic.
CREATE OR REPLACE FUNCTION public.rajmudra_bank_balance(p_exclude_bank_fd_id BIGINT DEFAULT NULL)
RETURNS NUMERIC
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH entries AS (
    SELECT id, type, amount, renewed_from_id
    FROM public.bank_fd
    WHERE p_exclude_bank_fd_id IS NULL OR id <> p_exclude_bank_fd_id
  ), renewed_sources AS (
    SELECT renewed_from_id
    FROM entries
    WHERE type = 'renew' AND renewed_from_id IS NOT NULL
  )
  SELECT COALESCE(SUM(CASE
    WHEN id IN (SELECT renewed_from_id FROM renewed_sources) THEN 0
    WHEN type IN ('deposit', 'renew', 'cash_to_bank', 'upi_to_bank', 'interest', 'bank_income') THEN amount
    WHEN type IN ('withdrawal', 'bank_to_cash', 'bank_to_upi', 'fd_expense', 'charge', 'bank_expense') THEN -amount
    ELSE 0
  END), 0)
  FROM entries;
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
  renewal_source_amount NUMERIC;
  old_id BIGINT := NULL;
  bank_delta NUMERIC := 0;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    old_id := OLD.id;
    IF EXISTS (
      SELECT 1 FROM public.bank_fd
      WHERE type = 'renew' AND renewed_from_id = OLD.id AND id <> OLD.id
    ) THEN
      RAISE EXCEPTION 'This old FD has already been renewed and its amount/type/year cannot be changed.'
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('rajmudra:bank'));
  PERFORM pg_advisory_xact_lock(hashtext('rajmudra:treasury:' || NEW.year));

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

  bank_before := public.rajmudra_bank_balance(old_id);

  IF NEW.type = 'renew' THEN
    IF NEW.renewed_from_id IS NULL THEN
      RAISE EXCEPTION 'Select the old FD being renewed.' USING ERRCODE = 'P0001';
    END IF;
    IF TG_OP = 'UPDATE' AND NEW.renewed_from_id = OLD.id THEN
      RAISE EXCEPTION 'An FD cannot renew itself.' USING ERRCODE = 'P0001';
    END IF;
    SELECT amount INTO renewal_source_amount
    FROM public.bank_fd
    WHERE id = NEW.renewed_from_id
      AND type IN ('deposit', 'renew', 'cash_to_bank', 'upi_to_bank');
    IF renewal_source_amount IS NULL THEN
      RAISE EXCEPTION 'The selected FD is unavailable for renewal.' USING ERRCODE = 'P0001';
    END IF;
    IF EXISTS (
      SELECT 1 FROM public.bank_fd
      WHERE type = 'renew' AND renewed_from_id = NEW.renewed_from_id
        AND (old_id IS NULL OR id <> old_id)
    ) THEN
      RAISE EXCEPTION 'The selected FD has already been renewed.' USING ERRCODE = 'P0001';
    END IF;
    bank_after := bank_before - renewal_source_amount + NEW.amount;
  ELSE
    bank_delta := CASE
      WHEN NEW.type IN ('deposit', 'cash_to_bank', 'upi_to_bank', 'interest', 'bank_income') THEN NEW.amount
      WHEN NEW.type IN ('withdrawal', 'bank_to_cash', 'bank_to_upi', 'fd_expense', 'charge', 'bank_expense') THEN -NEW.amount
      ELSE 0
    END;
    bank_after := bank_before + bank_delta;
  END IF;

  IF bank_after < 0 THEN
    RAISE EXCEPTION 'Insufficient Bank / FD balance. Available: Rs. %', bank_before
      USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_bank_fd_balance ON public.bank_fd;
CREATE TRIGGER validate_bank_fd_balance
BEFORE INSERT OR UPDATE OF amount, type, year, renewed_from_id ON public.bank_fd
FOR EACH ROW EXECUTE FUNCTION public.rajmudra_validate_bank_entry_balance();

CREATE OR REPLACE FUNCTION public.rajmudra_prevent_renewed_fd_source_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.bank_fd WHERE type = 'renew' AND renewed_from_id = OLD.id) THEN
    RAISE EXCEPTION 'This old FD has already been renewed and cannot be deleted.'
      USING ERRCODE = 'P0001';
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS prevent_renewed_fd_source_delete ON public.bank_fd;
CREATE TRIGGER prevent_renewed_fd_source_delete
BEFORE DELETE ON public.bank_fd
FOR EACH ROW EXECUTE FUNCTION public.rajmudra_prevent_renewed_fd_source_delete();

NOTIFY pgrst, 'reload schema';
