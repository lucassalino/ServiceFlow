-- Histórico de alterações a um evento (escala, setlist, roteiro): quem
-- mudou o quê e quando. Só leitura para admin/líder — não há update nem
-- delete, é um registo, não um estado editável.
create table if not exists public.event_activity_log (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  event_id    uuid not null references public.events(id) on delete cascade,
  actor_id    uuid references public.profiles(id) on delete set null,
  -- Nome do autor no momento da ação: sobrevive a uma troca de nome ou à
  -- saída da organização, o histórico continua legível.
  actor_name  text not null,
  message     text not null,
  created_at  timestamptz not null default now()
);

create index if not exists event_activity_log_event_id_idx
  on public.event_activity_log(event_id, created_at desc);

alter table public.event_activity_log enable row level security;

create policy "event_activity_log: admins/leaders can read" on public.event_activity_log
  for select using (public.is_org_admin_or_leader(org_id));

create policy "event_activity_log: admins/leaders can write" on public.event_activity_log
  for insert with check (public.is_org_admin_or_leader(org_id));
