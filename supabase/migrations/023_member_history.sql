-- ─────────────────────────────────────────────────────────────────────────────
-- Histórico do voluntário: participações passadas em escalas.
--
-- Não cria tabelas — os dados já existem em
--   event_schedules → event_ministries → events / ministries
-- É um problema de consulta, não de modelação.
--
-- Privacidade: só admins/líderes da organização veem o histórico de qualquer
-- pessoa. Um membro comum vê apenas o seu próprio.
-- ─────────────────────────────────────────────────────────────────────────────

-- Regra de acesso partilhada pelas duas funções abaixo.
create or replace function public.can_view_member_history(
  p_org_id uuid,
  p_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    (p_user_id = auth.uid() and public.is_org_member(p_org_id))
    or public.is_org_admin_or_leader(p_org_id);
$$;

comment on function public.can_view_member_history(uuid, uuid) is
  'true se quem chama pode ver o histórico de participações desta pessoa nesta organização.';

-- ── Linhas do histórico (paginadas, mais recente primeiro) ───────────────────

create or replace function public.fetch_member_history(
  p_org_id  uuid,
  p_user_id uuid,
  p_limit   integer default 50,
  p_offset  integer default 0
)
returns table (
  event_id       uuid,
  event_name     text,
  event_date     date,
  event_time     time,
  ministry_id    uuid,
  ministry_name  text,
  ministry_icon  text,
  ministry_color text,
  functions      text[],
  confirmed      boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.can_view_member_history(p_org_id, p_user_id) then
    raise exception 'Sem permissão para ver este histórico';
  end if;

  return query
  select
    e.id, e.name, e.date, e.time,
    mi.id, mi.name, mi.icon, mi.color,
    es.functions, es.confirmed
  from public.event_schedules es
  join public.event_ministries em on em.id = es.event_ministry_id
  join public.events          e  on e.id  = em.event_id
  join public.ministries      mi on mi.id = em.ministry_id
  where es.user_id = p_user_id
    and e.org_id   = p_org_id
    and e.date < current_date          -- só participações passadas
  order by e.date desc, e.time desc nulls last
  limit  greatest(p_limit, 0)
  offset greatest(p_offset, 0);
end $$;

comment on function public.fetch_member_history(uuid, uuid, integer, integer) is
  'Participações passadas de uma pessoa numa organização (data, ministério, funções, estado).';

-- ── Resumo agregado (evita uma segunda query no cliente) ─────────────────────
--
-- Nota sobre `confirmed`:
--   true  → a pessoa confirmou
--   false → a pessoa recusou
--   null  → nunca respondeu
-- NÃO temos registo de presença real após o evento, por isso `pending` não
-- deve ser lido como "falta". Medir faltas exigiria um campo novo.

create or replace function public.fetch_member_history_summary(
  p_org_id  uuid,
  p_user_id uuid
)
returns table (
  total        integer,
  confirmed    integer,
  declined     integer,
  pending      integer,
  ministries   integer,
  first_served date,
  last_served  date
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.can_view_member_history(p_org_id, p_user_id) then
    raise exception 'Sem permissão para ver este histórico';
  end if;

  return query
  select
    count(*)::integer,
    count(*) filter (where es.confirmed is true)::integer,
    count(*) filter (where es.confirmed is false)::integer,
    count(*) filter (where es.confirmed is null)::integer,
    count(distinct em.ministry_id)::integer,
    min(e.date),
    max(e.date)
  from public.event_schedules es
  join public.event_ministries em on em.id = es.event_ministry_id
  join public.events          e  on e.id  = em.event_id
  where es.user_id = p_user_id
    and e.org_id   = p_org_id
    and e.date < current_date;
end $$;

comment on function public.fetch_member_history_summary(uuid, uuid) is
  'Resumo do histórico: totais por estado, ministérios distintos e datas extremas.';

-- ── Permissões ───────────────────────────────────────────────────────────────

revoke all on function public.can_view_member_history(uuid, uuid) from public;
revoke all on function public.fetch_member_history(uuid, uuid, integer, integer) from public;
revoke all on function public.fetch_member_history_summary(uuid, uuid) from public;

grant execute on function public.can_view_member_history(uuid, uuid) to authenticated, service_role;
grant execute on function public.fetch_member_history(uuid, uuid, integer, integer) to authenticated, service_role;
grant execute on function public.fetch_member_history_summary(uuid, uuid) to authenticated, service_role;
