-- ============================================================
-- MEMBER UNAVAILABILITY (indisponibilidade — pontual ou recorrente semanal)
-- ============================================================
create table if not exists public.member_unavailability (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organizations(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  kind         text not null check (kind in ('date_range', 'weekly')),
  start_date   date,
  end_date     date,
  weekday      int check (weekday between 0 and 6),
  period       text check (period in ('manha', 'tarde', 'noite')),
  reason       text,
  created_at   timestamptz not null default now(),
  constraint member_unavailability_shape_check check (
    (kind = 'date_range' and start_date is not null and end_date is not null and weekday is null and period is null)
    or
    (kind = 'weekly' and weekday is not null and start_date is null and end_date is null)
  )
);

alter table public.member_unavailability enable row level security;

create policy "unavailability: org members can read" on public.member_unavailability
  for select using (public.is_org_member(org_id));

create policy "unavailability: own can insert" on public.member_unavailability
  for insert with check (user_id = auth.uid() and public.is_org_member(org_id));

create policy "unavailability: own or admin can delete" on public.member_unavailability
  for delete using (user_id = auth.uid() or public.is_org_admin(org_id));
