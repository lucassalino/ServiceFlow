-- SEGURANÇA — fechar brechas de autorização identificadas na auditoria.

-- (A) organization_members: remover a branch de auto-inscrição.
-- O join legítimo por código (joinOrganization) e os convites (invites.ts)
-- inserem via SERVICE ROLE (ignora RLS), por isso a branch self nunca era
-- usada pelo fluxo real — só permitia a qualquer autenticado inscrever-se em
-- qualquer org sabendo o UUID, sem convite, ganhando leitura de todos os
-- dados e do PII (email/telefone) dos membros.
drop policy if exists "org_members: admins can insert, self can join as member" on public.organization_members;
create policy "org_members: admins can insert"
  on public.organization_members
  for insert
  with check (is_org_admin(org_id));

-- (B) notifications: remover a branch event_id IS NULL.
-- O único fluxo legítimo (notifyScheduledMembersAction) insere sempre com
-- event_id e é admin/líder do evento. A branch NULL permitia a qualquer
-- autenticado criar uma notificação falsa para qualquer user_id (phishing).
drop policy if exists "notifications: admins/leaders can insert for org events" on public.notifications;
create policy "notifications: admins/leaders can insert for org events"
  on public.notifications
  for insert
  with check (
    exists (
      select 1 from public.events e
      where e.id = notifications.event_id and is_org_admin_or_leader(e.org_id)
    )
  );

-- (C) Revogar grants dormentes: estas tabelas são só service-role (RLS ativo,
-- zero políticas = negado). Os grants amplos eram um footgun — bastaria uma
-- política permissiva, ou desligar RLS por engano, para expor códigos de
-- cupão, convites e payloads de webhook. Revogar faz falhar fechado.
revoke all on public.coupons from anon, authenticated;
revoke all on public.coupon_redemptions from anon, authenticated;
revoke all on public.organization_invites from anon, authenticated;
revoke all on public.stripe_webhook_events from anon, authenticated;
