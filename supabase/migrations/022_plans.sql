-- ─────────────────────────────────────────────────────────────────────────────
-- Fase 1 dos planos pagos: modelar planos e limites.
-- Não integra Stripe — só deixa as colunas prontas para a Fase 2.
--
-- Decisões:
--  · A tabela `plans` passa a ser a FONTE DE VERDADE dos limites e preços
--    (src/lib/plans.ts fica só com tipos + fallback de UI).
--  · A associação org→plano continua em `org_subscriptions` (já existente,
--    1:1 com a org). Não duplicamos plan_id em `organizations` para não criar
--    duas fontes de verdade.
--  · `null` num limite significa ILIMITADO.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Catálogo de planos ────────────────────────────────────────────────────

create table if not exists public.plans (
  slug                    text primary key,
  name                    text not null,
  -- Limites: null = ilimitado
  max_people              integer,
  max_ministries          integer,
  max_admins              integer,
  -- Preços em euros
  price_monthly           numeric(8,2) not null default 0,
  price_annual            numeric(8,2) not null default 0,
  -- Stripe (Fase 2) — ficam nulos por agora
  stripe_price_id_monthly text,
  stripe_price_id_annual  text,
  sort_order              integer not null default 0,
  is_active               boolean not null default true,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

comment on table  public.plans is 'Catálogo de planos. Fonte de verdade dos limites e preços.';
comment on column public.plans.max_people is 'Máximo de pessoas (membros ativos + convites pendentes). null = ilimitado.';
comment on column public.plans.max_ministries is 'Máximo de ministérios. null = ilimitado.';
comment on column public.plans.max_admins is 'Máximo de administradores. null = ilimitado.';

-- Seed / atualização idempotente dos 4 planos.
insert into public.plans
  (slug, name, max_people, max_ministries, max_admins, price_monthly, price_annual, sort_order)
values
  ('semente',  'Semente',   10,   1,    1,     0.00,   0.00, 0),
  ('broto',    'Broto',     25,   5,    1,     9.99,  99.90, 1),
  ('colheita', 'Colheita',  60,   null, 3,    19.99, 199.90, 2),
  ('celeiro',  'Celeiro',   null, null, null, 39.99, 399.90, 3)
on conflict (slug) do update set
  name            = excluded.name,
  max_people      = excluded.max_people,
  max_ministries  = excluded.max_ministries,
  max_admins      = excluded.max_admins,
  price_monthly   = excluded.price_monthly,
  price_annual    = excluded.price_annual,
  sort_order      = excluded.sort_order,
  updated_at      = now();

-- Leitura pública (a página de apresentação vai listar os planos).
-- Escrita apenas por service-role (que ignora RLS).
alter table public.plans enable row level security;

drop policy if exists "plans: leitura pública" on public.plans;
create policy "plans: leitura pública" on public.plans
  for select using (true);

-- ── 2. Migrar os planos antigos para a nova nomenclatura ─────────────────────
-- Mapa: crescimento→broto, comunhao→colheita, expansao|ilimitado→celeiro.
-- (semente mantém-se: limites idênticos nos dois esquemas)

update public.org_subscriptions set plan = 'broto'    where plan = 'crescimento';
update public.org_subscriptions set plan = 'colheita' where plan = 'comunhao';
update public.org_subscriptions set plan = 'celeiro'  where plan in ('expansao', 'ilimitado');
-- Rede de segurança: qualquer valor desconhecido volta ao plano grátis.
update public.org_subscriptions set plan = 'semente'
  where plan not in ('semente', 'broto', 'colheita', 'celeiro');

-- O mesmo para cupões já criados (a tabela existe mas está vazia).
update public.coupons set plan = 'broto'    where plan = 'crescimento';
update public.coupons set plan = 'colheita' where plan = 'comunhao';
update public.coupons set plan = 'celeiro'  where plan in ('expansao', 'ilimitado');

-- ── 3. Colunas novas em org_subscriptions ────────────────────────────────────

alter table public.org_subscriptions
  add column if not exists billing_cycle text not null default 'monthly';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.org_subscriptions'::regclass
      and conname = 'org_subscriptions_billing_cycle_check'
  ) then
    alter table public.org_subscriptions
      add constraint org_subscriptions_billing_cycle_check
      check (billing_cycle in ('monthly', 'annual'));
  end if;
end $$;

-- Estados do ciclo de vida da subscrição.
--   active            — em vigor
--   free              — plano grátis
--   past_due          — pagamento falhado (Stripe, Fase 2)
--   downgraded_locked — despromovida; recursos acima do limite ficam trancados
--   expired/canceled  — estados já usados antes desta migração
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.org_subscriptions'::regclass
      and conname = 'org_subscriptions_status_check'
  ) then
    alter table public.org_subscriptions
      add constraint org_subscriptions_status_check
      check (status in ('active','free','past_due','downgraded_locked','expired','canceled'));
  end if;
end $$;

-- Integridade referencial com o catálogo (só depois de migrar os valores).
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.org_subscriptions'::regclass
      and conname = 'org_subscriptions_plan_fkey'
  ) then
    alter table public.org_subscriptions
      add constraint org_subscriptions_plan_fkey
      foreign key (plan) references public.plans(slug) on update cascade;
  end if;
end $$;

-- ── 4. Colunas de apoio ao futuro fluxo de downgrade ─────────────────────────
-- Ainda NÃO são usadas. Quando uma org for despromovida e ficar acima do
-- limite, guardam quais os recursos que o admin escolheu manter ativos.

alter table public.organizations
  add column if not exists active_ministry_ids uuid[] not null default '{}',
  add column if not exists active_member_ids   uuid[] not null default '{}';

comment on column public.organizations.active_ministry_ids is
  'Fluxo de downgrade (fase futura): ministérios que o admin escolheu manter ativos. Vazio = todos ativos.';
comment on column public.organizations.active_member_ids is
  'Fluxo de downgrade (fase futura): membros que o admin escolheu manter ativos. Vazio = todos ativos.';

-- ── 5. RPC de verificação de limites ─────────────────────────────────────────
-- Devolve o estado do limite para um tipo de recurso, em vez de um simples
-- booleano — assim o banner de "perto do limite" reutiliza a mesma chamada.
--
--   resource_type: 'people' | 'ministry' | 'admin'
--   retorno: { allowed, used, limit, plan_slug, plan_name }
--            limit = null significa ilimitado

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
  if p_resource_type not in ('people', 'ministry', 'admin') then
    raise exception 'resource_type inválido: % (usa people, ministry ou admin)', p_resource_type;
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

  else -- admin
    v_limit := v_plan.max_admins;
    select count(*) into v_used
    from public.organization_members m
    where m.org_id = p_org_id and m.is_active and m.role = 'admin';
  end if;

  return query select
    (v_limit is null or v_used < v_limit),
    v_used,
    v_limit,
    v_plan.slug,
    v_plan.name;
end $$;

comment on function public.check_plan_limit(uuid, text) is
  'Verifica se a organização pode criar mais um recurso do tipo indicado. limit null = ilimitado.';

revoke all on function public.check_plan_limit(uuid, text) from public;
grant execute on function public.check_plan_limit(uuid, text) to authenticated, service_role;
