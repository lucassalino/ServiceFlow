import type { SupabaseClient } from '@supabase/supabase-js';
import { sendBatch, isEmailConfigured, RESEND_BATCH_MAX, type ResendEmail } from './client';
import { FROM, SUPPORT_EMAIL } from './templates/layout';

/**
 * Envio de emails de notificação com três salvaguardas:
 *
 *  1. OPT-OUT     — quem desligou não recebe
 *  2. DEDUPLICAÇÃO — não repetimos o mesmo aviso à mesma pessoa
 *  3. QUOTA        — o plano gratuito do Resend dá 100/dia; ao aproximar-nos
 *                    do limite paramos e registamos, em vez de falhar em massa
 *
 * Nada aqui lança. Uma falha de email nunca pode impedir a publicação de uma
 * escala — o sino da app e o push continuam a ser o canal principal.
 */

/** Margem de segurança abaixo do limite diário de 100 do plano gratuito. */
const DAILY_CAP = 90;

export type EmailKind = 'schedule_published';

export interface Recipient {
  userId: string;
  email: string;
  subject: string;
  html: string;
  text: string;
}

export interface SendOutcome {
  sent: number;
  skippedOptOut: number;
  skippedDuplicate: number;
  skippedQuota: number;
  failed: number;
  /** Motivo legível quando nada foi enviado (para mostrar na UI). */
  note: string | null;
}

const EMPTY: SendOutcome = {
  sent: 0, skippedOptOut: 0, skippedDuplicate: 0,
  skippedQuota: 0, failed: 0, note: null,
};

/* eslint-disable @typescript-eslint/no-explicit-any */
type AdminClient = SupabaseClient<any, any, any>;

/**
 * Envia notificações por email, filtrando por opt-out, duplicados e quota.
 * `admin` tem de ser um cliente service-role (escreve em email_log).
 */
export async function sendNotificationEmails(params: {
  admin: AdminClient;
  orgId: string;
  eventId: string;
  kind: EmailKind;
  recipients: Recipient[];
}): Promise<SendOutcome> {
  const { admin, orgId, eventId, kind, recipients } = params;
  const outcome: SendOutcome = { ...EMPTY };

  if (recipients.length === 0) return outcome;

  if (!isEmailConfigured()) {
    return { ...outcome, note: 'O envio de emails ainda não está configurado.' };
  }

  // ── 1. Opt-out ─────────────────────────────────────────────────────────────
  const ids = recipients.map((r) => r.userId);
  const { data: optedOut } = await admin
    .from('profiles').select('id').in('id', ids).eq('email_opt_out', true);
  const optOutSet = new Set(((optedOut ?? []) as { id: string }[]).map((p) => p.id));

  // ── 2. Já enviados para este evento ────────────────────────────────────────
  const { data: already } = await admin
    .from('email_log').select('user_id')
    .eq('event_id', eventId).eq('kind', kind).eq('status', 'sent').in('user_id', ids);
  const sentSet = new Set(((already ?? []) as { user_id: string }[]).map((r) => r.user_id));

  const pending = recipients.filter((r) => {
    if (optOutSet.has(r.userId)) { outcome.skippedOptOut++; return false; }
    if (sentSet.has(r.userId))   { outcome.skippedDuplicate++; return false; }
    return true;
  });

  if (pending.length === 0) {
    return {
      ...outcome,
      note: outcome.skippedDuplicate > 0
        ? 'Estas pessoas já tinham recebido o email deste evento.'
        : 'Todas as pessoas selecionadas desativaram os emails.',
    };
  }

  // ── 3. Quota diária ────────────────────────────────────────────────────────
  const { data: usedToday } = await admin.rpc('email_quota_used_today');
  const used = typeof usedToday === 'number' ? usedToday : 0;
  const room = Math.max(0, DAILY_CAP - used);

  if (room === 0) {
    await logMany(admin, pending, { orgId, eventId, kind, status: 'skipped_quota' });
    return {
      ...outcome,
      skippedQuota: pending.length,
      note: 'Limite diário de emails atingido. A notificação na app continua a funcionar.',
    };
  }

  const toSend = pending.slice(0, room);
  const deferred = pending.slice(room);
  if (deferred.length > 0) {
    await logMany(admin, deferred, { orgId, eventId, kind, status: 'skipped_quota' });
    outcome.skippedQuota = deferred.length;
  }

  // ── 4. Envio, em lotes de RESEND_BATCH_MAX ─────────────────────────────────
  for (let i = 0; i < toSend.length; i += RESEND_BATCH_MAX) {
    const chunk = toSend.slice(i, i + RESEND_BATCH_MAX);
    const payload: ResendEmail[] = chunk.map((r) => ({
      from: FROM,
      to: [r.email],
      subject: r.subject,
      html: r.html,
      text: r.text,
      replyTo: SUPPORT_EMAIL,
      // Permite ao cliente de email oferecer "cancelar subscrição".
      headers: { 'List-Unsubscribe': '<https://wis-services.com/definicoes>' },
    }));

    const result = await sendBatch(payload);

    if (result.ok) {
      outcome.sent += chunk.length;
      await logMany(admin, chunk, {
        orgId, eventId, kind, status: 'sent', providerIds: result.ids,
      });
    } else {
      outcome.failed += chunk.length;
      await logMany(admin, chunk, {
        orgId, eventId, kind, status: 'failed', error: result.error,
      });
      // Regista mas não lança — quem chamou decide o que mostrar.
      console.error('[email] falha no envio:', result.error);
    }
  }

  if (outcome.sent === 0 && outcome.failed > 0) {
    outcome.note = 'Não foi possível enviar os emails. A notificação na app foi criada na mesma.';
  }

  return outcome;
}

async function logMany(
  admin: AdminClient,
  recipients: Recipient[],
  meta: {
    orgId: string; eventId: string; kind: EmailKind;
    status: 'sent' | 'failed' | 'skipped_quota' | 'skipped_optout';
    providerIds?: string[];
    error?: string;
  },
): Promise<void> {
  const rows = recipients.map((r, i) => ({
    user_id: r.userId,
    org_id: meta.orgId,
    event_id: meta.eventId,
    kind: meta.kind,
    status: meta.status,
    provider_id: meta.providerIds?.[i] ?? null,
    error: meta.error ?? null,
  }));
  // O índice único de deduplicação pode rejeitar corridas — ignoramos.
  const { error } = await admin.from('email_log').upsert(rows, { ignoreDuplicates: true });
  if (error) console.error('[email] falha ao registar envio:', error.message);
}
