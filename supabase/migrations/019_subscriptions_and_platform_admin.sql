-- ============================================================================
-- 019 — Planos / Subscrições + Super-admin da plataforma (sem pagamento)
-- ============================================================================
-- - Tabela org_subscriptions: 1 subscrição por organização.
-- - source: como a org obteve o plano ('free' | 'manual' | 'coupon' | 'stripe').
-- - Concessão manual ("permissão dev") feita por um platform_admin via server action.
-- - Enforcement dos limites é feito no código (server actions), não aqui.
-- ============================================================================

-- 1) Flag de super-admin da plataforma (dono do produto)
alter table public.profiles
  add column if not exists is_platform_admin boolean not null default false;

-- 2) Tabela de subscrições (uma por organização)
create table if not exists public.org_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null unique references public.organizations(id) on delete cascade,
  plan        text not null default 'semente',
  source      text not null default 'free',      -- free | manual | coupon | stripe
  status      text not null default 'active',    -- active | expired | canceled
  started_at  timestamptz not null default now(),
  expires_at  timestamptz,                        -- null = vitalício / sem fim
  granted_by  uuid references public.profiles(id),
  note        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists org_subscriptions_org_id_idx on public.org_subscriptions(org_id);

-- 3) RLS: membros da org podem LER a subscrição; escrita só via service role (server actions)
alter table public.org_subscriptions enable row level security;

drop policy if exists "members read own org subscription" on public.org_subscriptions;
create policy "members read own org subscription"
  on public.org_subscriptions for select
  using (
    exists (
      select 1 from public.organization_members m
      where m.org_id = org_subscriptions.org_id
        and m.user_id = auth.uid()
        and m.is_active = true
    )
  );
-- (sem policies de INSERT/UPDATE/DELETE → só a service role escreve)

-- 4) Backfill: cada organização existente fica no plano grátis (semente)
insert into public.org_subscriptions (org_id, plan, source, status)
select o.id, 'semente', 'free', 'active'
from public.organizations o
where not exists (
  select 1 from public.org_subscriptions s where s.org_id = o.id
);

-- 5) Nova organização → cria automaticamente subscrição grátis
create or replace function public.create_default_subscription()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.org_subscriptions (org_id, plan, source, status)
  values (new.id, 'semente', 'free', 'active')
  on conflict (org_id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_create_default_subscription on public.organizations;
create trigger trg_create_default_subscription
  after insert on public.organizations
  for each row execute function public.create_default_subscription();

-- 6) DÁ-TE A TI A "permissão dev" (super-admin da plataforma)
--    Ajusta o email se necessário.
update public.profiles
  set is_platform_admin = true
  where email = 'it.workdeveloper@gmail.com';
