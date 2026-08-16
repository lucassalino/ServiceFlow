-- Roteiros de culto (liturgia): sequência de momentos do culto criada pelo
-- pastor/responsáveis. Os momentos vivem num JSONB ordenado (estrutura vinda
-- da app HolyFlow): { nome, tipo: 'pessoa'|'video'|'projecao', responsavel,
-- duracao, obs, palavraTema, palavraTexto, musicas[], avisos[] }.

create table if not exists public.liturgies (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  name        text not null,
  date        date,
  theme       text not null default '',
  key_verse   text not null default '',
  moments     jsonb not null default '[]'::jsonb,
  created_by  uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists liturgies_org_id_idx on public.liturgies(org_id);

alter table public.liturgies enable row level security;

create policy "liturgies: org members can read" on public.liturgies
  for select using (public.is_org_member(org_id));

create policy "liturgies: admins/leaders can write" on public.liturgies
  for insert with check (public.is_org_admin_or_leader(org_id));

create policy "liturgies: admins/leaders can update" on public.liturgies
  for update using (public.is_org_admin_or_leader(org_id));

create policy "liturgies: admins/leaders can delete" on public.liturgies
  for delete using (public.is_org_admin_or_leader(org_id));
