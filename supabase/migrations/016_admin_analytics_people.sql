-- Adds a people listing to the AnalyticDashboard admin RPCs: name, email,
-- phone and which organizations each person belongs to. Same admin-only
-- gate as the other admin_analytics_* functions.

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
  group by p.id, p.full_name, p.email, p.phone, p.created_at
  order by p.created_at asc;
end;
$$;

revoke all on function public.admin_analytics_people() from public, anon;
grant execute on function public.admin_analytics_people() to authenticated;
