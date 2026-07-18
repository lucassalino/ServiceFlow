-- Restringe a leitura de member_unavailability: só o próprio ou admin/líder da organização.
-- Antes qualquer membro da org conseguia ver o motivo de indisponibilidade de qualquer outro.
drop policy if exists "unavailability: org members can read" on public.member_unavailability;

create policy "unavailability: self or admin/leader can read" on public.member_unavailability
  for select using (user_id = auth.uid() or public.is_org_admin_or_leader(org_id));
