-- ============================================================================
-- 021 — Auto-serviço: membro adiciona os seus ministérios/funções + onboarding
-- ============================================================================
-- - profiles.default_functions: funções preferidas do utilizador (globais),
--   usadas para pré-preencher ao entrar noutra organização.
-- - RLS: cada utilizador pode gerir as SUAS próprias linhas em ministry_members.
-- ============================================================================

alter table public.profiles
  add column if not exists default_functions text[] not null default '{}';

-- O próprio utilizador gere as suas participações (além de admins/líderes).
drop policy if exists "ministry_members: self read" on public.ministry_members;
create policy "ministry_members: self read" on public.ministry_members
  for select using (user_id = auth.uid());

drop policy if exists "ministry_members: self insert" on public.ministry_members;
create policy "ministry_members: self insert" on public.ministry_members
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.ministries m
      join public.organization_members om on om.org_id = m.org_id
      where m.id = ministry_id and om.user_id = auth.uid() and om.is_active = true
    )
  );

drop policy if exists "ministry_members: self update" on public.ministry_members;
create policy "ministry_members: self update" on public.ministry_members
  for update using (user_id = auth.uid());

drop policy if exists "ministry_members: self delete" on public.ministry_members;
create policy "ministry_members: self delete" on public.ministry_members
  for delete using (user_id = auth.uid());
