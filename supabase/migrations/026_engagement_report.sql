-- ─────────────────────────────────────────────────────────────────────────────
-- Relatório de engajamento por organização.
--
-- NOTA IMPORTANTE SOBRE "FALTAS":
-- A aplicação não regista presença real depois do evento. O que existe é a
-- resposta da pessoa à escala (`event_schedules.confirmed`):
--     true  → confirmou
--     false → recusou
--     null  → nunca respondeu
-- Por isso este relatório NÃO reporta faltas — reporta confirmações, recusas
-- e ausência de resposta. Medir faltas a sério exigiria um campo novo,
-- preenchido depois do evento.
--
-- As funções admin_analytics_* já existentes são da PLATAFORMA (restritas ao
-- administrador da plataforma). Esta é por organização, para admins/líderes.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.org_engagement_report(
  p_org_id      uuid,
  p_from        date,
  p_to          date,
  p_ministry_id uuid default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  if not public.is_org_admin_or_leader(p_org_id) then
    raise exception 'Sem permissão para ver os relatórios desta organização';
  end if;

  with base as (
    select
      es.user_id,
      es.confirmed,
      es.functions,
      e.id   as event_id,
      e.date as event_date,
      mi.id    as ministry_id,
      mi.name  as ministry_name,
      mi.icon  as ministry_icon,
      mi.color as ministry_color
    from public.event_schedules es
    join public.event_ministries em on em.id = es.event_ministry_id
    join public.events          e  on e.id  = em.event_id
    join public.ministries      mi on mi.id = em.ministry_id
    where e.org_id = p_org_id
      and e.date between p_from and p_to
      and (p_ministry_id is null or mi.id = p_ministry_id)
  )
  select jsonb_build_object(

    'summary', (
      select jsonb_build_object(
        'events',      count(distinct event_id),
        'assignments', count(*),
        'people',      count(distinct user_id),
        'confirmed',   count(*) filter (where confirmed is true),
        'declined',    count(*) filter (where confirmed is false),
        'pending',     count(*) filter (where confirmed is null)
      )
      from base
    ),

    -- Frequência de participação, por pessoa
    'people', coalesce((
      select jsonb_agg(p order by p->>'assignments' desc, p->>'name')
      from (
        select jsonb_build_object(
          'user_id',     b.user_id,
          'name',        coalesce(pr.full_name, pr.email, 'Sem nome'),
          'avatar_url',  pr.avatar_url,
          'assignments', count(*),
          'confirmed',   count(*) filter (where b.confirmed is true),
          'declined',    count(*) filter (where b.confirmed is false),
          'pending',     count(*) filter (where b.confirmed is null),
          'ministries',  count(distinct b.ministry_id),
          'last_served', max(b.event_date)
        ) as p
        from base b
        left join public.profiles pr on pr.id = b.user_id
        group by b.user_id, pr.full_name, pr.email, pr.avatar_url
      ) t
    ), '[]'::jsonb),

    -- Distribuição por ministério
    'ministries', coalesce((
      select jsonb_agg(m order by m->>'assignments' desc)
      from (
        select jsonb_build_object(
          'ministry_id', b.ministry_id,
          'name',        b.ministry_name,
          'icon',        b.ministry_icon,
          'color',       b.ministry_color,
          'assignments', count(*),
          'people',      count(distinct b.user_id),
          'events',      count(distinct b.event_id)
        ) as m
        from base b
        group by b.ministry_id, b.ministry_name, b.ministry_icon, b.ministry_color
      ) t
    ), '[]'::jsonb),

    -- Pessoas da organização que NÃO serviram no período
    'inactive_people', coalesce((
      select jsonb_agg(jsonb_build_object(
        'user_id', om.user_id,
        'name',    coalesce(pr.full_name, pr.email, 'Sem nome'),
        'avatar_url', pr.avatar_url
      ) order by coalesce(pr.full_name, pr.email))
      from public.organization_members om
      left join public.profiles pr on pr.id = om.user_id
      where om.org_id = p_org_id
        and om.is_active
        and om.user_id not in (select user_id from base)
    ), '[]'::jsonb)

  ) into v_result;

  return v_result;
end $$;

comment on function public.org_engagement_report(uuid, date, date, uuid) is
  'Relatório de engajamento de uma organização num período. NÃO reporta faltas (não há registo de presença) — reporta confirmações, recusas e ausência de resposta.';

revoke all on function public.org_engagement_report(uuid, date, date, uuid) from public;
grant execute on function public.org_engagement_report(uuid, date, date, uuid) to authenticated, service_role;
