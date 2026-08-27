-- ====================================================================
-- RAJMUDRA GROUP PWA - SUPABASE DATABASE SCHEMA & RLS SECURITY POLICIES
-- Execute this SQL script in your Supabase SQL Editor once.
-- ====================================================================

-- 1. Create Members Table
CREATE TABLE IF NOT EXISTS public.members (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT DEFAULT '',
    address TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Vargani (Donations) Table
CREATE TABLE IF NOT EXISTS public.vargani (
    id BIGINT PRIMARY KEY,
    prefix TEXT DEFAULT 'श्री',
    member_id BIGINT,
    member_name TEXT NOT NULL,
    phone TEXT DEFAULT '',
    year TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    payment_mode TEXT DEFAULT 'Cash',
    status TEXT DEFAULT 'paid',
    date DATE NOT NULL,
    receipt_no TEXT DEFAULT '',
    note TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Jama (Income) Table
CREATE TABLE IF NOT EXISTS public.jama (
    id BIGINT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    year TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    payment_mode TEXT DEFAULT 'Cash',
    date DATE NOT NULL,
    note TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Kharch (Expenses) Table
CREATE TABLE IF NOT EXISTS public.kharch (
    id BIGINT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    year TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    date DATE NOT NULL,
    note TEXT DEFAULT '',
    is_locked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create Aarti Table
CREATE TABLE IF NOT EXISTS public.aarti (
    id BIGINT PRIMARY KEY,
    year TEXT NOT NULL,
    day_title TEXT NOT NULL,
    date DATE NOT NULL,
    morning_time TEXT DEFAULT '09.00 AM',
    morning_host TEXT DEFAULT '',
    evening_time TEXT DEFAULT '08.00 PM',
    evening_host TEXT DEFAULT '',
    note TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create Bank FD Table
CREATE TABLE IF NOT EXISTS public.bank_fd (
    id BIGINT PRIMARY KEY,
    title TEXT NOT NULL,
    type TEXT DEFAULT 'deposit',
    year TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    interest_rate NUMERIC DEFAULT 0,
    expected_returns NUMERIC DEFAULT 0,
    bank_name TEXT DEFAULT 'Mandal Bank FD Account',
    date DATE NOT NULL,
    expiry_date DATE,
    note TEXT DEFAULT '',
    is_locked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- PERFORMANCE INDEXES
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_vargani_year ON public.vargani(year);
CREATE INDEX IF NOT EXISTS idx_jama_year ON public.jama(year);
CREATE INDEX IF NOT EXISTS idx_kharch_year ON public.kharch(year);
CREATE INDEX IF NOT EXISTS idx_aarti_year ON public.aarti(year);
CREATE INDEX IF NOT EXISTS idx_bank_fd_year ON public.bank_fd(year);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Enable RLS and grant read/write access to anon client key
-- ====================================================================

-- Members RLS
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon full access members" ON public.members;
CREATE POLICY "Allow anon full access members" ON public.members FOR ALL USING (true) WITH CHECK (true);

-- Vargani RLS
ALTER TABLE public.vargani ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon full access vargani" ON public.vargani;
CREATE POLICY "Allow anon full access vargani" ON public.vargani FOR ALL USING (true) WITH CHECK (true);

-- Jama RLS
ALTER TABLE public.jama ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon full access jama" ON public.jama;
CREATE POLICY "Allow anon full access jama" ON public.jama FOR ALL USING (true) WITH CHECK (true);

-- Kharch RLS
ALTER TABLE public.kharch ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon full access kharch" ON public.kharch;
CREATE POLICY "Allow anon full access kharch" ON public.kharch FOR ALL USING (true) WITH CHECK (true);

-- Aarti RLS
ALTER TABLE public.aarti ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon full access aarti" ON public.aarti;
CREATE POLICY "Allow anon full access aarti" ON public.aarti FOR ALL USING (true) WITH CHECK (true);

-- Bank FD RLS
ALTER TABLE public.bank_fd ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon full access bank_fd" ON public.bank_fd;
CREATE POLICY "Allow anon full access bank_fd" ON public.bank_fd FOR ALL USING (true) WITH CHECK (true);
