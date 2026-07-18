-- ============================================================
-- EVENT TIMELINE ITEMS (Roteiro do evento — hora + título)
-- ============================================================
create table if not exists public.event_timeline_items (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references public.events(id) on delete cascade,
  time          time not null,
  title         text not null,
  order_index   int not null default 0,
  created_at    timestamptz not null default now()
);

alter table public.event_timeline_items enable row level security;

create policy "event_timeline: org members can read" on public.event_timeline_items
  for select using (
    exists (
      select 1 from public.events e where e.id = event_id and public.is_org_member(e.org_id)
    )
  );

create policy "event_timeline: admins/leaders can write" on public.event_timeline_items
  for insert with check (
    exists (
      select 1 from public.events e where e.id = event_id and public.is_org_admin_or_leader(e.org_id)
    )
  );

create policy "event_timeline: admins/leaders can update" on public.event_timeline_items
  for update using (
    exists (
      select 1 from public.events e where e.id = event_id and public.is_org_admin_or_leader(e.org_id)
    )
  );
