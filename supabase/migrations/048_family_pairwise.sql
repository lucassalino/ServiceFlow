-- Redesenho: a preferência de família passa a ser POR PAR de pessoas, não
-- por grupo. Ex.: A pode querer servir junto com B mas separado de C — não
-- dava para expressar isso com uma preferência única por "família".
-- (migração 047 tinha só 1 registo de teste, sem dados reais em causa.)

drop table if exists public.family_members;
drop table if exists public.families;

create table public.family_relationships (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  -- user_id_1 < user_id_2 sempre (ordem normalizada), para o par nunca duplicar.
  user_id_1 uuid not null references auth.users(id) on delete cascade,
  user_id_2 uuid not null references auth.users(id) on delete cascade,
  preference text not null check (preference in ('junto', 'separado', 'indiferente')),
  requested_by uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (user_id_1 < user_id_2),
  unique (org_id, user_id_1, user_id_2)
);

create index family_relationships_org_idx on public.family_relationships(org_id);
create index family_relationships_user1_idx on public.family_relationships(org_id, user_id_1);
create index family_relationships_user2_idx on public.family_relationships(org_id, user_id_2);

alter table public.family_relationships enable row level security;

create policy "family_relationships: org members can read"
  on public.family_relationships for select
  using (is_org_member(org_id));

create policy "family_relationships: participant can propose"
  on public.family_relationships for insert
  with check (
    is_org_member(org_id)
    and requested_by = auth.uid()
    and auth.uid() in (user_id_1, user_id_2)
  );

-- Aceitar, mudar a preferência, ou "reabrir" para confirmação depois de
-- editar — qualquer um dos dois lados pode, desde que continue a ser um
-- dos dois. A app decide, no update, se o status volta a 'pending'.
create policy "family_relationships: participant can update"
  on public.family_relationships for update
  using (auth.uid() in (user_id_1, user_id_2));

create policy "family_relationships: participant can delete"
  on public.family_relationships for delete
  using (auth.uid() in (user_id_1, user_id_2));
