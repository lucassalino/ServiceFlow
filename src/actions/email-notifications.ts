'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { sendNotificationEmails, type Recipient, type SendOutcome } from '@/lib/email/send';
import { renderSchedulePublished } from '@/lib/email/templates/schedule-published';
import { isEmailConfigured } from '@/lib/email/client';

/* eslint-disable @typescript-eslint/no-explicit-any */
function getAdmin(): any {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/** Destinatário possível, para a UI de seleção. */
export interface EmailCandidate {
  userId: string;
  name: string;
  email: string | null;
  /** true = desativou os emails de notificação. */
  optedOut: boolean;
  /** true = já recebeu o email deste evento. */
  alreadySent: boolean;
  ministries: string[];
}

/** Quem está escalado neste evento e pode receber email. */
export async function fetchEmailCandidatesAction(
  eventId: string,
): Promise<{ configured: boolean; candidates: EmailCandidate[] }> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');

  const admin = getAdmin();

  const { data: ems } = await supabase
    .from('event_ministries').select('id, ministry:ministries(name)').eq('event_id', eventId);
  const emList = (ems ?? []) as unknown as { id: string; ministry: { name: string } | null }[];
  const emIds = emList.map((e) => e.id);
  if (emIds.length === 0) return { configured: isEmailConfigured(), candidates: [] };

  const ministryByEm = new Map(emList.map((e) => [e.id, e.ministry?.name ?? '']));

  const { data: schedules } = await supabase
    .from('event_schedules')
    .select('user_id, event_ministry_id, profile:profiles(full_name, email, email_opt_out)')
    .in('event_ministry_id', emIds);

  type Row = {
    user_id: string; event_ministry_id: string;
    profile: { full_name: string; email: string; email_opt_out: boolean } | null;
  };

  const byUser = new Map<string, EmailCandidate & { _min: Set<string> }>();
  for (const s of (schedules ?? []) as unknown as Row[]) {
    let entry = byUser.get(s.user_id);
    if (!entry) {
      entry = {
        userId: s.user_id,
        name: s.profile?.full_name || s.profile?.email || 'Sem nome',
        email: s.profile?.email ?? null,
        optedOut: !!s.profile?.email_opt_out,
        alreadySent: false,
        ministries: [],
        _min: new Set<string>(),
      };
      byUser.set(s.user_id, entry);
    }
    const mn = ministryByEm.get(s.event_ministry_id);
    if (mn) entry._min.add(mn);
  }

  // Quem já recebeu o email deste evento
  const { data: sent } = await admin
    .from('email_log').select('user_id')
    .eq('event_id', eventId).eq('kind', 'schedule_published').eq('status', 'sent');
  const sentSet = new Set(((sent ?? []) as { user_id: string }[]).map((r) => r.user_id));

  const candidates = [...byUser.values()].map(({ _min, ...c }) => ({
    ...c,
    ministries: [..._min],
    alreadySent: sentSet.has(c.userId),
  }));

  return { configured: isEmailConfigured(), candidates };
}

/**
 * Envia o email de "foste escalado" às pessoas selecionadas.
 * Nunca lança por falha de email — devolve o resumo para a UI.
 */
export async function sendSchedulePublishedEmailsAction(
  eventId: string,
  userIds: string[],
): Promise<SendOutcome> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');

  const empty: SendOutcome = {
    sent: 0, skippedOptOut: 0, skippedDuplicate: 0,
    skippedQuota: 0, failed: 0, note: null,
  };
  if (userIds.length === 0) return empty;

  // Evento (e validação implícita de acesso pela RLS do cliente do utilizador)
  const { data: event, error: eventError } = await supabase
    .from('events').select('id, org_id, name, date, time, location').eq('id', eventId).single();
  if (eventError || !event) throw new Error('Evento não encontrado');
  const ev = event as {
    id: string; org_id: string; name: string;
    date: string; time: string | null; location: string | null;
  };

  // Só admin/líder pode disparar emails em nome da organização.
  const { data: membership } = await supabase
    .from('organization_members').select('role')
    .eq('org_id', ev.org_id).eq('user_id', user.id).maybeSingle();
  const role = (membership as { role?: string } | null)?.role;
  if (role !== 'admin' && role !== 'leader') {
    throw new Error('Apenas administradores ou líderes podem enviar emails');
  }

  const { candidates } = await fetchEmailCandidatesAction(eventId);
  const chosen = candidates.filter((c) => userIds.includes(c.userId) && !!c.email);

  const recipients: Recipient[] = chosen.map((c) => {
    const rendered = renderSchedulePublished({
      name: c.name.split(' ')[0] || c.name,
      eventName: ev.name,
      eventDate: ev.date,
      eventTime: ev.time,
      location: ev.location,
      assignments: c.ministries.map((m) => ({ ministry: m, functions: [] })),
      orgId: ev.org_id,
      eventId: ev.id,
    });
    return {
      userId: c.userId,
      email: c.email!,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    };
  });

  return sendNotificationEmails({
    admin: getAdmin(),
    orgId: ev.org_id,
    eventId: ev.id,
    kind: 'schedule_published',
    recipients,
  });
}
