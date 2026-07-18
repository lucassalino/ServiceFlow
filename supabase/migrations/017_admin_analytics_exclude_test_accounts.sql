-- Exclude QA/debug test accounts (test_debug_*@mailinator.com) from every
-- admin_analytics_* function so they don't skew people/org counts or show
-- up in the dashboard listing.

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
    'total_profiles', (
      select count(*) from public.profiles p
      where p.email not ilike '%@mailinator.com'
        and p.email not ilike 'test\_debug\_%' escape '\'
    ),
    'total_organizations',   (select count(*) from public.organizations),
    'total_org_songs',       (select count(*) from public.songs),
    'total_catalog_songs',   (select count(*) from public.catalog_songs),
    'total_events',          (select count(*) from public.events),
    'published_events',      (select count(*) from public.events where is_published),
    'total_ministries',      (select count(*) from public.ministries),
    'total_setlist_entries', (select count(*) from public.event_setlists),
    'active_memberships', (
      select count(*)
      from public.organization_members om
      join public.profiles p on p.id = om.user_id
      where om.is_active
        and p.email not ilike '%@mailinator.com'
        and p.email not ilike 'test\_debug\_%' escape '\'
    )
  );
end;
$$;

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
    coalesce((
      select count(*) from public.profiles p
      where date_trunc('month', p.created_at) = m.month
        and p.email not ilike '%@mailinator.com'
        and p.email not ilike 'test\_debug\_%' escape '\'
    ), 0) as new_profiles,
    coalesce((select count(*) from public.organizations o
              where date_trunc('month', o.created_at) = m.month), 0) as new_organizations
  from months m
  order by m.month;
end;
$$;

create or replace function public.admin_analytics_people()
returns table (
  person_id uuid,
  full_name text,
  email text,
  phone text,
  created_at timestamptz,
  organizations text
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
    p.id,
    p.full_name,
    p.email,
    p.phone,
    p.created_at,
    coalesce(string_agg(distinct o.name, ', ' order by o.name), '—') as organizations
  from public.profiles p
  left join public.organization_members om on om.user_id = p.id and om.is_active
  left join public.organizations o on o.id = om.org_id
  where p.email not ilike '%@mailinator.com'
    and p.email not ilike 'test\_debug\_%' escape '\'
  group by p.id, p.full_name, p.email, p.phone, p.created_at
  order by p.created_at asc;
end;
$$;

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
    (
      select count(*)
      from public.organization_members om
      join public.profiles p on p.id = om.user_id
      where om.org_id = o.id
        and om.is_active
        and p.email not ilike '%@mailinator.com'
        and p.email not ilike 'test\_debug\_%' escape '\'
    ) as member_count,
    (select count(*) from public.songs s where s.org_id = o.id) as song_count,
    (select count(*) from public.events e where e.org_id = o.id) as event_count
  from public.organizations o
  order by o.created_at asc;
end;
$$;
