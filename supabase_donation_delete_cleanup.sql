-- ====================================================================
-- PERMANENT DONATION DELETE + ONE-TIME ORPHAN MEMBER CLEANUP
-- ====================================================================
-- Run after supabase_auth_rls.sql. This preserves a member whenever they have
-- another donation in any year, but removes test/orphan members with no
-- donation history. It does not delete any surviving donation record.

DELETE FROM public.members AS member
WHERE NOT EXISTS (
  SELECT 1
  FROM public.vargani AS donation
  WHERE donation.member_id = member.id
);

CREATE OR REPLACE FUNCTION public.delete_vargani_and_orphan_member(p_vargani_id BIGINT)
RETURNS TABLE (deleted_vargani_id BIGINT, deleted_member_id BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  removed_vargani_id BIGINT;
  donation_member_id BIGINT;
  removed_member_id BIGINT := NULL;
BEGIN
  IF NOT COALESCE(public.is_rajmudra_admin(), FALSE) THEN
    RAISE EXCEPTION 'Only an administrator can delete a donation.' USING ERRCODE = '42501';
  END IF;

  DELETE FROM public.vargani
  WHERE id = p_vargani_id
  RETURNING id, member_id INTO removed_vargani_id, donation_member_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Donation % was not found.', p_vargani_id USING ERRCODE = 'P0002';
  END IF;

  IF donation_member_id IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM public.vargani WHERE member_id = donation_member_id) THEN
    DELETE FROM public.members
    WHERE id = donation_member_id
    RETURNING id INTO removed_member_id;
  END IF;

  RETURN QUERY SELECT removed_vargani_id, removed_member_id;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_vargani_and_orphan_member(BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_vargani_and_orphan_member(BIGINT) TO authenticated;
