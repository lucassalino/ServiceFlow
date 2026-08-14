-- Mural de recados: avisos gerais da organização, à parte da comunicação
-- pessoal ("notifications" é uma caixa de entrada por pessoa/evento).

create table if not exists public.announcements (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  title       text not null,
  body        text not null,
  pinned      boolean not null default false,
  created_by  uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists announcements_org_id_idx on public.announcements(org_id);

alter table public.announcements enable row level security;

create policy "announcements: org members can read" on public.announcements
  for select using (public.is_org_member(org_id));

create policy "announcements: admins/leaders can write" on public.announcements
  for insert with check (public.is_org_admin_or_leader(org_id));

create policy "announcements: admins/leaders can update" on public.announcements
  for update using (public.is_org_admin_or_leader(org_id));

create policy "announcements: admins/leaders can delete" on public.announcements
  for delete using (public.is_org_admin_or_leader(org_id));
