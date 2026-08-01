-- ─────────────────────────────────────────────────────────────────────────────
-- Lembretes por email (Resend).
--
-- Duas necessidades:
--  1. Opt-out por utilizador (RGPD + respeito básico)
--  2. Registo de envios, para dois fins:
--       · deduplicação — não enviar o mesmo aviso duas vezes à mesma pessoa
--       · quota — o plano gratuito do Resend dá 100 emails/dia, 3.000/mês
--
-- Emails de CONTA (recuperar password, confirmar email) passam pelo Supabase
-- Auth e NÃO respeitam o opt-out — são transacionais críticos.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Opt-out ──────────────────────────────────────────────────────────────────

alter table public.profiles
  add column if not exists email_opt_out boolean not null default false;

comment on column public.profiles.email_opt_out is
  'true = não receber emails de notificação (escalas). Não afeta emails de conta.';

-- ── Registo de envios ────────────────────────────────────────────────────────

create table if not exists public.email_log (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  org_id      uuid references public.organizations(id) on delete cascade,
  event_id    uuid references public.events(id) on delete cascade,
  kind        text not null,
  status      text not null,
  provider_id text,
  error       text,
  sent_at     timestamptz not null default now(),
  constraint email_log_status_check
    check (status in ('sent', 'failed', 'skipped_quota', 'skipped_optout'))
);

comment on table public.email_log is
  'Registo de emails de notificação: serve para deduplicar e para contar a quota diária.';
comment on column public.email_log.kind is
  'Tipo de email, ex.: schedule_published.';

-- Deduplicação: um envio BEM SUCEDIDO por (pessoa, evento, tipo).
-- Índice parcial — tentativas falhadas não bloqueiam nova tentativa.
create unique index if not exists email_log_dedup_idx
  on public.email_log (user_id, event_id, kind)
  where status = 'sent' and event_id is not null;

-- Contagem da quota diária.
create index if not exists email_log_sent_at_idx
  on public.email_log (sent_at)
  where status = 'sent';

-- ── RLS ──────────────────────────────────────────────────────────────────────
-- O registo é escrito pelo servidor (service-role, que ignora RLS).
-- Leitura: só admins/líderes da organização, para poderem diagnosticar.

alter table public.email_log enable row level security;

drop policy if exists "email_log: admins/leaders can read" on public.email_log;
create policy "email_log: admins/leaders can read" on public.email_log
  for select using (org_id is not null and public.is_org_admin_or_leader(org_id));

-- ── Quota diária ─────────────────────────────────────────────────────────────

create or replace function public.email_quota_used_today()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer
  from public.email_log
  where status = 'sent'
    and sent_at >= date_trunc('day', now());
$$;

comment on function public.email_quota_used_today() is
  'Emails enviados com sucesso hoje — usado para não exceder o limite do plano do Resend.';

revoke all on function public.email_quota_used_today() from public;
grant execute on function public.email_quota_used_today() to authenticated, service_role;
