-- Família: grupos de pessoas da mesma organização com uma preferência de
-- escala (junto / separado / indiferente). Cada pessoa pertence no máximo
-- a uma família por organização. Quem cria convida os outros — cada
-- convidado tem de aceitar antes da preferência valer para ele (status
-- 'pending' -> 'accepted'; recusar apaga a linha).

create table public.families (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  preference text not null default 'indiferente'
    check (preference in ('junto', 'separado', 'indiferente')),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  invited_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (org_id, user_id)
);

create index families_org_id_idx on public.families(org_id);
create index family_members_family_id_idx on public.family_members(family_id);
create index family_members_org_user_idx on public.family_members(org_id, user_id);

alter table public.families enable row level security;
alter table public.family_members enable row level security;

-- families: qualquer membro da organização vê; só quem criou edita/apaga.
create policy "families: org members can read"
  on public.families for select
  using (is_org_member(org_id));

create policy "families: creator can insert"
  on public.families for insert
  with check (created_by = auth.uid() and is_org_member(org_id));

create policy "families: creator can update"
  on public.families for update
  using (created_by = auth.uid());

create policy "families: creator can delete"
  on public.families for delete
  using (created_by = auth.uid());

-- family_members: qualquer membro da organização vê (para os avisos na
-- escala aparecerem a quem está a escalar); só quem convidou insere; o
-- próprio convidado só mexe na sua linha (aceitar = update; recusar/sair =
-- delete); quem criou a família também pode remover outros membros.
create policy "family_members: org members can read"
  on public.family_members for select
  using (is_org_member(org_id));

create policy "family_members: family creator can insert"
  on public.family_members for insert
  with check (
    is_org_member(org_id)
    and invited_by = auth.uid()
    and exists (
      select 1 from public.families f
      where f.id = family_id and f.created_by = auth.uid()
    )
  );

create policy "family_members: invitee can accept"
  on public.family_members for update
  using (user_id = auth.uid());

create policy "family_members: invitee or creator can remove"
  on public.family_members for delete
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.families f
      where f.id = family_id and f.created_by = auth.uid()
    )
  );
