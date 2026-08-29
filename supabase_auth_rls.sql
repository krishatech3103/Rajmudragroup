-- ====================================================================
-- RAJMUDRA SUPABASE AUTH + ADMIN / VIEWER ACCESS CONTROL
-- ====================================================================
-- Run this ONCE in Supabase SQL Editor only after you have created the
-- admin and viewer users in Authentication > Users.
--
-- This does not delete ledger data. It removes the previous anonymous access
-- policies, so the previous frontend will no longer work after this runs.
-- Deploy the matching Auth-enabled frontend at the same time.
-- ====================================================================

-- The role is stored server-side, never in browser storage or user metadata.
CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'viewer')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own Rajmudra role" ON public.user_roles;
CREATE POLICY "Users can read their own Rajmudra role"
ON public.user_roles FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- No client INSERT, UPDATE, or DELETE policy exists for user_roles. Assign
-- roles in the SQL Editor / Supabase Dashboard only.

CREATE OR REPLACE FUNCTION public.is_rajmudra_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = (SELECT auth.uid())
      AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_rajmudra_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_rajmudra_admin() TO authenticated;

-- Ensure the browser's anonymous key cannot access the database at all.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vargani ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jama ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kharch ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aarti ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_fd ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Remove the former public/anonymous compatibility policies.
DROP POLICY IF EXISTS "Allow anon full access members" ON public.members;
DROP POLICY IF EXISTS "Allow anon full access vargani" ON public.vargani;
DROP POLICY IF EXISTS "Allow anon full access jama" ON public.jama;
DROP POLICY IF EXISTS "Allow anon full access kharch" ON public.kharch;
DROP POLICY IF EXISTS "Allow anon full access aarti" ON public.aarti;
DROP POLICY IF EXISTS "Allow anon full access bank_fd" ON public.bank_fd;
DROP POLICY IF EXISTS "Allow anon full access app settings" ON public.app_settings;

-- Every authenticated Rajmudra account may read. Only server-confirmed
-- admins can insert, edit, import, or delete records.
DROP POLICY IF EXISTS "Rajmudra authenticated read members" ON public.members;
CREATE POLICY "Rajmudra authenticated read members" ON public.members
FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Rajmudra admins manage members" ON public.members;
CREATE POLICY "Rajmudra admins manage members" ON public.members
FOR ALL TO authenticated
USING ((SELECT public.is_rajmudra_admin()))
WITH CHECK ((SELECT public.is_rajmudra_admin()));

DROP POLICY IF EXISTS "Rajmudra authenticated read vargani" ON public.vargani;
CREATE POLICY "Rajmudra authenticated read vargani" ON public.vargani
FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Rajmudra admins manage vargani" ON public.vargani;
CREATE POLICY "Rajmudra admins manage vargani" ON public.vargani
FOR ALL TO authenticated
USING ((SELECT public.is_rajmudra_admin()))
WITH CHECK ((SELECT public.is_rajmudra_admin()));

DROP POLICY IF EXISTS "Rajmudra authenticated read jama" ON public.jama;
CREATE POLICY "Rajmudra authenticated read jama" ON public.jama
FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Rajmudra admins manage jama" ON public.jama;
CREATE POLICY "Rajmudra admins manage jama" ON public.jama
FOR ALL TO authenticated
USING ((SELECT public.is_rajmudra_admin()))
WITH CHECK ((SELECT public.is_rajmudra_admin()));

DROP POLICY IF EXISTS "Rajmudra authenticated read kharch" ON public.kharch;
CREATE POLICY "Rajmudra authenticated read kharch" ON public.kharch
FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Rajmudra admins manage kharch" ON public.kharch;
CREATE POLICY "Rajmudra admins manage kharch" ON public.kharch
FOR ALL TO authenticated
USING ((SELECT public.is_rajmudra_admin()))
WITH CHECK ((SELECT public.is_rajmudra_admin()));

DROP POLICY IF EXISTS "Rajmudra authenticated read aarti" ON public.aarti;
CREATE POLICY "Rajmudra authenticated read aarti" ON public.aarti
FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Rajmudra admins manage aarti" ON public.aarti;
CREATE POLICY "Rajmudra admins manage aarti" ON public.aarti
FOR ALL TO authenticated
USING ((SELECT public.is_rajmudra_admin()))
WITH CHECK ((SELECT public.is_rajmudra_admin()));

DROP POLICY IF EXISTS "Rajmudra authenticated read bank_fd" ON public.bank_fd;
CREATE POLICY "Rajmudra authenticated read bank_fd" ON public.bank_fd
FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Rajmudra admins manage bank_fd" ON public.bank_fd;
CREATE POLICY "Rajmudra admins manage bank_fd" ON public.bank_fd
FOR ALL TO authenticated
USING ((SELECT public.is_rajmudra_admin()))
WITH CHECK ((SELECT public.is_rajmudra_admin()));

DROP POLICY IF EXISTS "Rajmudra authenticated read app settings" ON public.app_settings;
CREATE POLICY "Rajmudra authenticated read app settings" ON public.app_settings
FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Rajmudra admins manage app settings" ON public.app_settings;
CREATE POLICY "Rajmudra admins manage app settings" ON public.app_settings
FOR ALL TO authenticated
USING ((SELECT public.is_rajmudra_admin()))
WITH CHECK ((SELECT public.is_rajmudra_admin()));

-- Assign roles after creating users in Authentication > Users. Replace the
-- sample emails, then run only these two statements (or use user UUIDs).
--
-- INSERT INTO public.user_roles (user_id, role)
-- SELECT id, 'admin' FROM auth.users WHERE email = 'admin@example.com'
-- ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role, updated_at = NOW();
--
-- INSERT INTO public.user_roles (user_id, role)
-- SELECT id, 'viewer' FROM auth.users WHERE email = 'viewer@example.com'
-- ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role, updated_at = NOW();
