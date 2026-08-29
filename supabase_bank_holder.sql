-- Store who currently holds Cash or UPI after a transfer or FD withdrawal.
-- Safe to run on an existing Supabase database.
ALTER TABLE public.bank_fd
ADD COLUMN IF NOT EXISTS holder_name TEXT NOT NULL DEFAULT '';
