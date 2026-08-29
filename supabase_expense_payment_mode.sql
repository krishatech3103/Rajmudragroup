-- Add Cash / UPI payment tracking to existing expense records.
-- Safe to run once or repeatedly; existing expenses become Cash by default.
ALTER TABLE public.kharch
ADD COLUMN IF NOT EXISTS payment_mode TEXT NOT NULL DEFAULT 'Cash';

UPDATE public.kharch
SET payment_mode = 'Cash'
WHERE payment_mode IS NULL OR BTRIM(payment_mode) = '';

-- Ask PostgREST to see the new column immediately after the migration.
NOTIFY pgrst, 'reload schema';
