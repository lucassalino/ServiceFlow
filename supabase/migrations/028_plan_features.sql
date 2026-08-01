-- ─────────────────────────────────────────────────────────────────────────────
-- Gating por plano: features booleanas.
--
-- A migração 022 tratou os limites por QUANTIDADE (pessoas, ministérios,
-- admins) via check_plan_limit. Faltava o outro tipo de gating: features que
-- ou se têm ou não se têm.
--
-- Guardamos num array em `plans` (e não numa tabela) porque o catálogo é
-- pequeno e assim mudar o que cada plano inclui é um UPDATE, não um deploy.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.plans
  add column if not exists features text[] not null default '{}';

comment on column public.plans.features is
  'Chaves das funcionalidades incluídas no plano. Ver src/lib/plan-features.ts.';

-- Cada plano inclui tudo o que os anteriores incluem (escada cumulativa).
update public.plans set features = '{}'::text[]
  where slug = 'semente';

update public.plans set features = array[
  'member_history',        -- histórico de participações do voluntário
  'notifications'          -- notificações na app
] where slug = 'broto';

update public.plans set features = array[
  'member_history',
  'notifications',
  'recurring_unavailability', -- padrão mensal ("2ª terça do mês")
  'calendar_sync',            -- feed .ics subscrito
  'event_timeline',           -- roteiro do evento
  'song_ranking',             -- ranking de músicas
  'pdf_export'                -- exportar escala em PDF
] where slug = 'colheita';

update public.plans set features = array[
  'member_history',
  'notifications',
  'recurring_unavailability',
  'calendar_sync',
  'event_timeline',
  'song_ranking',
  'pdf_export',
  'email_notifications',   -- avisar a equipa por email
  'engagement_reports',    -- relatórios de engajamento
  'priority_support'
] where slug = 'celeiro';

-- O plano Celeiro anunciava "multi-campus". Essa funcionalidade foi posta em
-- standby: uma igreja com vários campus cria uma organização (e assinatura)
-- por campus. Removido da lista para não prometer o que não existe.

-- ── Verificação de acesso a uma feature ──────────────────────────────────────

create or replace function public.org_has_feature(
  p_org_id  uuid,
  p_feature text
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_slug     text;
  v_expired  boolean;
  v_features text[];
begin
  -- Só membros da organização podem perguntar pelo plano dela.
  if not public.is_org_member(p_org_id) then
    return false;
  end if;

  select s.plan, (s.expires_at is not null and s.expires_at < now())
    into v_slug, v_expired
  from public.org_subscriptions s
  where s.org_id = p_org_id;

  if v_slug is null or v_expired then
    v_slug := 'semente';
  end if;

  select p.features into v_features from public.plans p where p.slug = v_slug;
  return coalesce(p_feature = any(v_features), false);
end $$;

comment on function public.org_has_feature(uuid, text) is
  'true se o plano atual da organização inclui a funcionalidade indicada.';

-- Estado completo do plano numa chamada: slug, nome, features e se é cortesia.
create or replace function public.org_plan_state(p_org_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_row      record;
  v_plan     public.plans%rowtype;
  v_expired  boolean;
  v_slug     text;
begin
  if not public.is_org_member(p_org_id) then
    raise exception 'Sem acesso a esta organização';
  end if;

  select s.plan, s.source, s.status, s.expires_at, s.billing_cycle
    into v_row
  from public.org_subscriptions s where s.org_id = p_org_id;

  v_expired := v_row.expires_at is not null and v_row.expires_at < now();
  v_slug := case when v_row.plan is null or v_expired then 'semente' else v_row.plan end;

  select * into v_plan from public.plans where slug = v_slug;

  return jsonb_build_object(
    'slug',      v_plan.slug,
    'name',      v_plan.name,
    'features',  to_jsonb(v_plan.features),
    -- 'manual' = cortesia concedida por nós, sem pagamento
    'courtesy',  coalesce(v_row.source, 'free') = 'manual',
    'source',    coalesce(v_row.source, 'free'),
    'status',    coalesce(v_row.status, 'free'),
    'expires_at', v_row.expires_at,
    'billing_cycle', coalesce(v_row.billing_cycle, 'monthly')
  );
end $$;

comment on function public.org_plan_state(uuid) is
  'Estado do plano da organização: slug, nome, features, e se é cortesia (source=manual).';

revoke all on function public.org_has_feature(uuid, text) from public;
revoke all on function public.org_plan_state(uuid) from public;
grant execute on function public.org_has_feature(uuid, text) to authenticated, service_role;
grant execute on function public.org_plan_state(uuid) to authenticated, service_role;
