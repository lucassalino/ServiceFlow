-- Security hardening pass, based on Supabase's built-in advisor findings.
-- Each change was verified against the actual app code before applying:
--   - handle_new_user: only ever invoked by the auth.users insert trigger,
--     never called directly by clients. Revoking direct EXECUTE doesn't
--     affect the trigger (trigger firing doesn't need role-level EXECUTE).
--   - create_org_with_member: dead code. Org creation today goes through
--     src/app/new-org/actions.ts using the service-role admin client, not
--     this RPC (checked both the Next.js app and the old Expo app).
--   - is_org_member / is_org_admin / is_org_admin_or_leader: used inside
--     RLS policies, so `authenticated` must keep EXECUTE. `anon` has no
--     legitimate caller (every policy that uses them requires auth.uid()),
--     so we drop just that grant.
--   - avatars/events storage buckets are bucket-level `public = true`,
--     which already serves objects via the public URL without any RLS
--     check. The "public read" SELECT policies on storage.objects were
--     only adding the ability to LIST/enumerate every file in the bucket
--     via the API — removing them doesn't affect getPublicUrl() or image
--     rendering, only the ability to enumerate the bucket.

-- 1) Fix mutable search_path (SECURITY DEFINER + no fixed search_path is
--    the classic search_path-hijacking footgun).
alter function public.handle_new_user() set search_path = public;
alter function public.is_org_member(uuid) set search_path = public;
alter function public.is_org_admin_or_leader(uuid) set search_path = public;
alter function public.is_org_admin(uuid) set search_path = public;

-- 2) handle_new_user: trigger-only, no direct API access needed.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- 3) create_org_with_member: unused RPC from an earlier implementation.
revoke execute on function public.create_org_with_member(text, text, uuid) from public, anon, authenticated;

-- 4) RLS helper functions: keep `authenticated` (required by policies),
--    drop `anon` (no policy ever grants it anything real).
revoke execute on function public.is_org_member(uuid) from anon;
revoke execute on function public.is_org_admin_or_leader(uuid) from anon;
revoke execute on function public.is_org_admin(uuid) from anon;

-- 5) Storage: stop allowing full bucket listing on public buckets.
drop policy if exists "avatars: public read" on storage.objects;
drop policy if exists "events bucket: public read" on storage.objects;

-- Revoking from `anon` alone wasn't enough: functions get an implicit
-- EXECUTE grant to PUBLIC on creation, and every role (including anon)
-- inherits PUBLIC's privileges. Revoke from PUBLIC directly, keep the
-- explicit authenticated grant.
revoke execute on function public.is_org_member(uuid) from public;
revoke execute on function public.is_org_admin_or_leader(uuid) from public;
revoke execute on function public.is_org_admin(uuid) from public;

grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.is_org_admin_or_leader(uuid) to authenticated;
grant execute on function public.is_org_admin(uuid) to authenticated;
