-- ============================================================
-- ServiceFlow — Permitir que um membro saia da organização
-- ============================================================

-- A policy "org_members: admins can delete" já existia para
-- admins removerem outros membros. Esta nova policy permite que
-- qualquer membro remova a sua própria linha (i.e. "saír" da
-- organização). A lógica de impedir que o único admin saia fica
-- a cargo da aplicação (ver useLeaveOrganization).
create policy "org_members: users can leave (delete self)" on public.organization_members
  for delete using (user_id = auth.uid());
