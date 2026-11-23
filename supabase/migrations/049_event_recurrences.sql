-- Eventos recorrentes: um "molde" (dia da semana + hora + ministérios) a
-- partir do qual geramos eventos reais em rascunho, só do mês atual e do
-- mês seguinte (a validação do intervalo fica na Server Action).
create table event_recurrences (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  weekday integer not null check (weekday between 0 and 6), -- 0=domingo … 6=sábado
  time time not null,
  arrival_time time,
  location text,
  color text,
  description text,
  active boolean not null default true,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table event_recurrence_ministries (
  id uuid primary key default gen_random_uuid(),
  recurrence_id uuid not null references event_recurrences(id) on delete cascade,
  ministry_id uuid not null references ministries(id) on delete cascade,
  unique(recurrence_id, ministry_id)
);

-- Liga o evento gerado à recorrência que o originou — permite gerar de
-- forma idempotente (não duplicar o mesmo dia) e identificar na UI.
alter table events add column recurrence_id uuid references event_recurrences(id) on delete set null;
create unique index events_recurrence_date_uq on events(recurrence_id, date) where recurrence_id is not null;

alter table event_recurrences enable row level security;
alter table event_recurrence_ministries enable row level security;

create policy "event_recurrences: org members can read"
  on event_recurrences for select using (is_org_member(org_id));
create policy "event_recurrences: admins/leaders can write"
  on event_recurrences for insert with check (is_org_admin_or_leader(org_id));
create policy "event_recurrences: admins/leaders can update"
  on event_recurrences for update using (is_org_admin_or_leader(org_id));
create policy "event_recurrences: admins can delete"
  on event_recurrences for delete using (is_org_admin(org_id));

create policy "event_recurrence_ministries: org members can read"
  on event_recurrence_ministries for select using (
    exists (select 1 from event_recurrences r where r.id = recurrence_id and is_org_member(r.org_id))
  );
create policy "event_recurrence_ministries: admins/leaders can write"
  on event_recurrence_ministries for insert with check (
    exists (select 1 from event_recurrences r where r.id = recurrence_id and is_org_admin_or_leader(r.org_id))
  );
create policy "event_recurrence_ministries: admins/leaders can delete"
  on event_recurrence_ministries for delete using (
    exists (select 1 from event_recurrences r where r.id = recurrence_id and is_org_admin_or_leader(r.org_id))
  );
