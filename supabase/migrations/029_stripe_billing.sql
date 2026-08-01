-- ─────────────────────────────────────────────────────────────────────────────
-- Fase 2: campos de faturação Stripe.
--
-- `plans.stripe_price_id_monthly/annual` já existiam (migração 022), prontos
-- para os 8 Price IDs. Só faltava onde guardar a ligação da ORGANIZAÇÃO ao
-- cliente/subscrição do Stripe — fica em `org_subscriptions`, junto do resto
-- do estado do plano (mesma linha, não uma tabela nova).
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.org_subscriptions
  add column if not exists stripe_customer_id     text,
  add column if not exists stripe_subscription_id  text;

comment on column public.org_subscriptions.stripe_customer_id is
  'Customer do Stripe associado a esta organização. Reutilizado entre checkouts — nunca criar um segundo customer para a mesma org.';
comment on column public.org_subscriptions.stripe_subscription_id is
  'Subscription ativa no Stripe. null se a org nunca chegou a subscrever (ou já cancelou e voltou ao Semente).';

-- Um customer/subscription do Stripe pertence, no máximo, a uma organização.
create unique index if not exists org_subscriptions_stripe_customer_idx
  on public.org_subscriptions (stripe_customer_id) where stripe_customer_id is not null;
create unique index if not exists org_subscriptions_stripe_subscription_idx
  on public.org_subscriptions (stripe_subscription_id) where stripe_subscription_id is not null;

-- ── Registo de eventos de webhook processados ────────────────────────────────
-- O Stripe pode reenviar o mesmo evento (falhas de rede, retries). Sem isto,
-- um checkout.session.completed reenviado poderia processar-se duas vezes.

create table if not exists public.stripe_webhook_events (
  id           text primary key,  -- o próprio event.id do Stripe (evt_...)
  type         text not null,
  processed_at timestamptz not null default now()
);

comment on table public.stripe_webhook_events is
  'Deduplicação de webhooks do Stripe: um evento (evt_...) só é processado uma vez.';

alter table public.stripe_webhook_events enable row level security;
-- Sem policies de leitura/escrita para authenticated/anon: só o service-role
-- (usado pelo handler do webhook) lhe mexe.
