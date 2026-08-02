-- ─────────────────────────────────────────────────────────────────────────────
-- Separa o limite de "administrador" do de "líder".
--
-- Antes: max_admins variava por plano (1/1/3/null) e cobria só o papel
-- 'admin'. Decisão de produto: só pode haver 1 admin por organização em
-- QUALQUER plano — quem varia por plano é o número de líderes.
--   Semente/Broto:  0 líderes (só o admin)
--   Colheita:       até 3 líderes
--   Celeiro:        líderes ilimitados
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.plans
  add column if not exists max_leaders integer;

comment on column public.plans.max_leaders is 'Máximo de líderes (papel leader). null = ilimitado. Admin é sempre 1, em qualquer plano.';

update public.plans set max_admins = 1, max_leaders = 0   where slug = 'semente';
update public.plans set max_admins = 1, max_leaders = 0   where slug = 'broto';
update public.plans set max_admins = 1, max_leaders = 3   where slug = 'colheita';
update public.plans set max_admins = 1, max_leaders = null where slug = 'celeiro';

-- ── RPC: adiciona o resource_type 'leader' ──────────────────────────────────

create or replace function public.check_plan_limit(
  p_org_id uuid,
  p_resource_type text
)
returns table (
  allowed   boolean,
  used      integer,
  "limit"   integer,
  plan_slug text,
  plan_name text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan   public.plans%rowtype;
  v_slug   text;
  v_expired boolean;
  v_used   integer;
  v_limit  integer;
begin
  if p_resource_type not in ('people', 'ministry', 'admin', 'leader') then
    raise exception 'resource_type inválido: % (usa people, ministry, admin ou leader)', p_resource_type;
  end if;

  -- Plano efetivo da organização (subscrição expirada volta ao plano grátis).
  select s.plan, (s.expires_at is not null and s.expires_at < now())
    into v_slug, v_expired
  from public.org_subscriptions s
  where s.org_id = p_org_id;

  if v_slug is null or v_expired then
    v_slug := 'semente';
  end if;

  select * into v_plan from public.plans p where p.slug = v_slug;
  if not found then
    select * into v_plan from public.plans p where p.slug = 'semente';
  end if;

  -- Utilização atual
  if p_resource_type = 'people' then
    v_limit := v_plan.max_people;
    select
      (select count(*) from public.organization_members m
        where m.org_id = p_org_id and m.is_active)
      +
      (select count(*) from public.organization_invites i
        where i.org_id = p_org_id and i.accepted_at is null)
      into v_used;

  elsif p_resource_type = 'ministry' then
    v_limit := v_plan.max_ministries;
    select count(*) into v_used
    from public.ministries mi where mi.org_id = p_org_id;

  elsif p_resource_type = 'admin' then
    v_limit := v_plan.max_admins;
    select count(*) into v_used
    from public.organization_members m
    where m.org_id = p_org_id and m.is_active and m.role = 'admin';

  else -- leader
    v_limit := v_plan.max_leaders;
    select count(*) into v_used
    from public.organization_members m
    where m.org_id = p_org_id and m.is_active and m.role = 'leader';
  end if;

  return query select
    (v_limit is null or v_used < v_limit),
    v_used,
    v_limit,
    v_plan.slug,
    v_plan.name;
end $$;
