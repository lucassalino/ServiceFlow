-- ─────────────────────────────────────────────────────────────────────────────
-- Sincronização de calendário: feed .ics subscrito por token.
--
-- HISTÓRIA: a migração 012 criou esta tabela e a 013 apagou-a no MESMO commit
-- (42bcd62). A nota da 013 explica que o feed subscrito foi trocado por
-- download por evento. Mas download não é sincronização — é uma fotografia:
-- se a escala mudar, o evento no telemóvel fica desatualizado.
--
-- Retomamos o feed, com o que faltava à 012:
--   · token REVOGÁVEL (regenerar invalida o anterior)
--   · last_used_at, para a pessoa ver se o link está mesmo a ser usado
--   · o download por evento MANTÉM-SE — resolve o caso "quero só este"
--
-- SEGURANÇA: o feed é lido pelos servidores da Google/Apple, sem sessão. O
-- segredo é o próprio token. Quem tiver o link vê os compromissos da pessoa —
-- por isso a UI avisa disso e permite regenerar a qualquer momento.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.calendar_feed_tokens (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organizations(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  token        text not null unique default encode(gen_random_bytes(24), 'hex'),
  created_at   timestamptz not null default now(),
  last_used_at timestamptz,
  unique (org_id, user_id)
);

comment on table public.calendar_feed_tokens is
  'Token secreto do feed .ics pessoal. Um por (organização, pessoa). Regenerável.';
comment on column public.calendar_feed_tokens.last_used_at is
  'Última vez que o feed foi lido — ajuda a perceber se o link ainda está em uso.';

create index if not exists calendar_feed_tokens_token_idx
  on public.calendar_feed_tokens (token);

alter table public.calendar_feed_tokens enable row level security;

-- Só o dono gere o seu token. A rota do feed usa service-role (ignora RLS),
-- porque quem a chama é o Google/Apple, sem sessão — o segredo é o token.
drop policy if exists "calendar feed token: own can read" on public.calendar_feed_tokens;
create policy "calendar feed token: own can read" on public.calendar_feed_tokens
  for select using (user_id = auth.uid());

drop policy if exists "calendar feed token: own can insert" on public.calendar_feed_tokens;
create policy "calendar feed token: own can insert" on public.calendar_feed_tokens
  for insert with check (user_id = auth.uid() and public.is_org_member(org_id));

-- Novo face à 012: permitir regenerar o token.
drop policy if exists "calendar feed token: own can update" on public.calendar_feed_tokens;
create policy "calendar feed token: own can update" on public.calendar_feed_tokens
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "calendar feed token: own can delete" on public.calendar_feed_tokens;
create policy "calendar feed token: own can delete" on public.calendar_feed_tokens
  for delete using (user_id = auth.uid());
