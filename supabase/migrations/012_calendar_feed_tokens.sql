-- ============================================================
-- CALENDAR FEED TOKENS (link .ics pessoal para sincronizar com Google/Apple Calendar)
-- ============================================================
create table if not exists public.calendar_feed_tokens (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organizations(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  token      text not null unique default encode(gen_random_bytes(24), 'hex'),
  created_at timestamptz not null default now(),
  unique (org_id, user_id)
);

alter table public.calendar_feed_tokens enable row level security;

-- Só o próprio dono vê/gere o seu token; a rota pública do feed usa a service role (bypassa RLS)
-- e o segredo está no próprio token, não numa sessão autenticada.
create policy "calendar feed token: own can read" on public.calendar_feed_tokens
  for select using (user_id = auth.uid());

create policy "calendar feed token: own can insert" on public.calendar_feed_tokens
  for insert with check (user_id = auth.uid() and public.is_org_member(org_id));

create policy "calendar feed token: own can delete" on public.calendar_feed_tokens
  for delete using (user_id = auth.uid());
