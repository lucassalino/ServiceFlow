-- Volta a permitir que qualquer membro da org veja QUE alguém está indisponível (para poder pedir trocas).
-- O motivo continua reservado a admin/líder — mas isso passa a ser aplicado na app (server action), não no RLS,
-- porque RLS do Postgres restringe LINHAS, não colunas.
drop policy if exists "unavailability: self or admin/leader can read" on public.member_unavailability;

create policy "unavailability: org members can read" on public.member_unavailability
  for select using (public.is_org_member(org_id));
