-- ============================================================================
-- 020 — Cupões / códigos promocionais (desbloqueiam planos sem pagamento)
-- ============================================================================
-- - Um cupão dá um plano por X dias (ou vitalício) a uma organização.
-- - Criados/geridos por um super-admin da plataforma (is_platform_admin).
-- - Resgatados pelo admin de uma org via server action (service role).
-- - Escrita/leitura só via service role → RLS ativo sem políticas públicas.
-- ============================================================================

create table if not exists public.coupons (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique,               -- guardado em MAIÚSCULAS
  plan          text not null,                       -- semente|crescimento|comunhao|expansao|ilimitado
  duration_days integer,                             -- null = vitalício
  max_uses      integer,                             -- null = ilimitado
  used_count    integer not null default 0,
  expires_at    timestamptz,                         -- null = cupão sem validade
  active        boolean not null default true,
  note          text,
  created_by    uuid references public.profiles(id),
  created_at    timestamptz not null default now()
);

create table if not exists public.coupon_redemptions (
  id           uuid primary key default gen_random_uuid(),
  coupon_id    uuid not null references public.coupons(id) on delete cascade,
  org_id       uuid not null references public.organizations(id) on delete cascade,
  redeemed_by  uuid references public.profiles(id),
  redeemed_at  timestamptz not null default now(),
  unique (coupon_id, org_id)   -- cada org só resgata um cupão uma vez
);

create index if not exists coupon_redemptions_org_idx on public.coupon_redemptions(org_id);

-- RLS ativo, sem políticas → só a service role (server actions) acede.
alter table public.coupons enable row level security;
alter table public.coupon_redemptions enable row level security;
