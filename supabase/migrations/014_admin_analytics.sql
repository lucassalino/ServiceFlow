-- Admin analytics RPCs for the AnalyticDashboard app.
-- Every function here is SECURITY DEFINER (reads across RLS) but self-checks
-- that the caller is the platform admin before returning anything, so the
-- anon/authenticated Supabase keys used by the public dashboard stay safe.

create or replace function public._admin_analytics_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(auth.jwt() ->> 'email', '') = 'it.workdeveloper@gmail.com';
$$;

comment on function public._admin_analytics_is_admin() is
  'Internal helper: true only for the ServiceFlow platform admin. Not exposed via API.';

-- ── Overview counters ────────────────────────────────────────────────────
create or replace function public.admin_analytics_overview()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public._admin_analytics_is_admin() then
    raise exception 'forbidden';
  end if;

  return jsonb_build_object(
    'total_profiles',        (select count(*) from public.profiles),
    'total_organizations',   (select count(*) from public.organizations),
    'total_org_songs',       (select count(*) from public.songs),
    'total_catalog_songs',   (select count(*) from public.catalog_songs),
    'total_events',          (select count(*) from public.events),
    'published_events',      (select count(*) from public.events where is_published),
    'total_ministries',      (select count(*) from public.ministries),
    'total_setlist_entries', (select count(*) from public.event_setlists),
    'active_memberships',    (select count(*) from public.organization_members where is_active)
  );
end;
$$;

-- ── Growth over time (signups + new orgs, per month) ────────────────────
create or replace function public.admin_analytics_growth_by_month(months_back int default 12)
returns table (
  month date,
  new_profiles bigint,
  new_organizations bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public._admin_analytics_is_admin() then
    raise exception 'forbidden';
  end if;

  return query
  with months as (
    select date_trunc('month', now())::date - (n || ' months')::interval as month
    from generate_series(months_back - 1, 0, -1) as n
  )
  select
    m.month::date,
    coalesce((select count(*) from public.profiles p
              where date_trunc('month', p.created_at) = m.month), 0) as new_profiles,
    coalesce((select count(*) from public.organizations o
              where date_trunc('month', o.created_at) = m.month), 0) as new_organizations
  from months m
  order by m.month;
end;
$$;

-- ── Most-used songs across all orgs (real "setlist" ranking) ────────────
create or replace function public.admin_analytics_top_songs(limit_count int default 10)
returns table (
  song_name text,
  artist text,
  times_used bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public._admin_analytics_is_admin() then
    raise exception 'forbidden';
  end if;

  return query
  select
    min(s.name) as song_name,
    min(nullif(s.artist, '')) as artist,
    count(es.id) as times_used
  from public.event_setlists es
  join public.songs s on s.id = es.song_id
  group by lower(s.name), lower(coalesce(s.artist, ''))
  order by times_used desc, song_name asc
  limit limit_count;
end;
$$;

-- ── Per-organization summary ─────────────────────────────────────────────
create or replace function public.admin_analytics_organizations()
returns table (
  org_id uuid,
  name text,
  created_at timestamptz,
  member_count bigint,
  song_count bigint,
  event_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public._admin_analytics_is_admin() then
    raise exception 'forbidden';
  end if;

  return query
  select
    o.id,
    o.name,
    o.created_at,
    (select count(*) from public.organization_members om where om.org_id = o.id and om.is_active) as member_count,
    (select count(*) from public.songs s where s.org_id = o.id) as song_count,
    (select count(*) from public.events e where e.org_id = o.id) as event_count
  from public.organizations o
  order by o.created_at asc;
end;
$$;

-- ── Grants: only logged-in users may call these; the admin check inside
--    each function does the real gatekeeping. anon has no access at all. ─
revoke all on function public.admin_analytics_overview() from public, anon;
revoke all on function public.admin_analytics_growth_by_month(int) from public, anon;
revoke all on function public.admin_analytics_top_songs(int) from public, anon;
revoke all on function public.admin_analytics_organizations() from public, anon;

grant execute on function public.admin_analytics_overview() to authenticated;
grant execute on function public.admin_analytics_growth_by_month(int) to authenticated;
grant execute on function public.admin_analytics_top_songs(int) to authenticated;
grant execute on function public.admin_analytics_organizations() to authenticated;
