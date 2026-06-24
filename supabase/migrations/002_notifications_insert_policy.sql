-- ============================================================
-- ServiceFlow — Notifications insert policy
-- Permite que admins/leaders de uma org criem notificações
-- para utilizadores escalados nos eventos dessa org (usado ao
-- publicar/notificar uma escala).
-- ============================================================

create policy "notifications: admins/leaders can insert for org events" on public.notifications
  for insert with check (
    event_id is null
    or exists (
      select 1 from public.events e
      where e.id = event_id
        and public.is_org_admin_or_leader(e.org_id)
    )
  );
