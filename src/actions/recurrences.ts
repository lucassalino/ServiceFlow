'use server';

import { createClient } from '@/lib/supabase/server';
import { logEventActivity } from '@/lib/activity-log';
import { findConflictingUnavailability } from '@/lib/availability';
import type { UnavailabilityEntry } from '@/actions/availability';
import type { FamilyPreference } from '@/actions/families';

// `event_recurrences`/`event_recurrence_ministries` são tabelas novas, ainda
// sem tipos gerados (ver migração 049) — daí o `as any` no cliente devolvido.
async function requireAdminOrLeader(orgId: string) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Sessão expirada');
  const { data: membership } = await supabase
    .from('organization_members').select('role')
    .eq('org_id', orgId).eq('user_id', user.id).maybeSingle();
  const role = (membership as { role?: string } | null)?.role;
  if (role !== 'admin' && role !== 'leader') throw new Error('Só admins e líderes podem gerir eventos recorrentes');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { supabase: supabase as any, userId: user.id };
}

export interface EventRecurrence {
  id: string;
  orgId: string;
  name: string;
  weekday: number; // 0 = domingo … 6 = sábado
  time: string;
  arrivalTime: string | null;
  location: string | null;
  color: string | null;
  description: string | null;
  active: boolean;
  ministryIds: string[];
}

export interface RecurrencePayload {
  name: string;
  weekday: number;
  time: string;
  arrivalTime?: string | null;
  location?: string | null;
  color?: string | null;
  description?: string | null;
  ministryIds: string[];
}

export async function fetchRecurrencesAction(orgId: string): Promise<EventRecurrence[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createClient()) as any;
  const { data, error } = await supabase
    .from('event_recurrences')
    .select('*, event_recurrence_ministries(ministry_id)')
    .eq('org_id', orgId)
    .order('weekday').order('time');
  if (error) throw new Error(error.message);

  type Row = {
    id: string; org_id: string; name: string; weekday: number; time: string;
    arrival_time: string | null; location: string | null; color: string | null;
    description: string | null; active: boolean;
    event_recurrence_ministries: { ministry_id: string }[];
  };
  return ((data ?? []) as unknown as Row[]).map((r) => ({
    id: r.id, orgId: r.org_id, name: r.name, weekday: r.weekday, time: r.time,
    arrivalTime: r.arrival_time, location: r.location, color: r.color,
    description: r.description, active: r.active,
    ministryIds: r.event_recurrence_ministries.map((m) => m.ministry_id),
  }));
}

export async function createRecurrenceAction(orgId: string, payload: RecurrencePayload): Promise<EventRecurrence> {
  const { supabase, userId } = await requireAdminOrLeader(orgId);
  const { data, error } = await supabase.from('event_recurrences').insert({
    org_id: orgId, name: payload.name, weekday: payload.weekday, time: payload.time,
    arrival_time: payload.arrivalTime ?? null, location: payload.location ?? null,
    color: payload.color ?? null, description: payload.description ?? null,
    created_by: userId,
  }).select().single();
  if (error) throw new Error(error.message);

  if (payload.ministryIds.length > 0) {
    const rows = payload.ministryIds.map((ministryId) => ({ recurrence_id: data.id, ministry_id: ministryId }));
    const { error: linkError } = await supabase.from('event_recurrence_ministries').insert(rows);
    if (linkError) throw new Error(linkError.message);
  }

  return {
    id: data.id, orgId, name: payload.name, weekday: payload.weekday, time: payload.time,
    arrivalTime: payload.arrivalTime ?? null, location: payload.location ?? null,
    color: payload.color ?? null, description: payload.description ?? null, active: true,
    ministryIds: payload.ministryIds,
  };
}

export async function updateRecurrenceAction(id: string, orgId: string, payload: RecurrencePayload): Promise<void> {
  const { supabase } = await requireAdminOrLeader(orgId);
  const { error } = await supabase.from('event_recurrences').update({
    name: payload.name, weekday: payload.weekday, time: payload.time,
    arrival_time: payload.arrivalTime ?? null, location: payload.location ?? null,
    color: payload.color ?? null, description: payload.description ?? null,
    updated_at: new Date().toISOString(),
  }).eq('id', id);
  if (error) throw new Error(error.message);

  await supabase.from('event_recurrence_ministries').delete().eq('recurrence_id', id);
  if (payload.ministryIds.length > 0) {
    const rows = payload.ministryIds.map((ministryId) => ({ recurrence_id: id, ministry_id: ministryId }));
    const { error: linkError } = await supabase.from('event_recurrence_ministries').insert(rows);
    if (linkError) throw new Error(linkError.message);
  }
}

export async function toggleRecurrenceActiveAction(id: string, orgId: string, active: boolean): Promise<void> {
  const { supabase } = await requireAdminOrLeader(orgId);
  const { error } = await supabase.from('event_recurrences')
    .update({ active, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteRecurrenceAction(id: string, orgId: string): Promise<void> {
  const { supabase } = await requireAdminOrLeader(orgId);
  const { error } = await supabase.from('event_recurrences').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ── Geração de eventos (rascunho) + sugestão de escala ──────────────────────

/** Todas as datas de um dia-da-semana, entre hoje e o fim do mês seguinte. */
function upcomingDatesForWeekday(weekday: number): string[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(today.getFullYear(), today.getMonth() + 2, 0); // último dia do mês seguinte
  const dates: string[] = [];
  const cursor = new Date(today);
  // avança até ao próximo dia certo (hoje incluído, se calhar)
  while (cursor.getDay() !== weekday) cursor.setDate(cursor.getDate() + 1);
  while (cursor <= end) {
    dates.push(cursor.toISOString().split('T')[0]);
    cursor.setDate(cursor.getDate() + 7);
  }
  return dates;
}

interface GeneratedEventSummary { date: string; eventId: string; recurrenceName: string }

/**
 * Gera (se ainda não existirem) os eventos em falta de cada recorrência ativa,
 * só entre hoje e o fim do mês seguinte. Cada evento nasce como rascunho
 * (`is_published = false`) com uma escala sugerida — o admin/líder tem de
 * abrir o evento, rever/ajustar e publicar manualmente (nada é notificado
 * aqui). Idempotente: corre sempre que a tela de Eventos é aberta.
 */
export async function generateUpcomingRecurrenceEventsAction(orgId: string): Promise<GeneratedEventSummary[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createClient()) as any;
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');

  const { data: recRows, error: recError } = await supabase
    .from('event_recurrences')
    .select('*, event_recurrence_ministries(ministry_id)')
    .eq('org_id', orgId).eq('active', true);
  if (recError) throw new Error(recError.message);

  type RecRow = {
    id: string; name: string; weekday: number; time: string; arrival_time: string | null;
    location: string | null; color: string | null; description: string | null;
    event_recurrence_ministries: { ministry_id: string }[];
  };
  const recurrences = (recRows ?? []) as unknown as RecRow[];
  if (recurrences.length === 0) return [];

  // Datas já geradas (qualquer recorrência) — evita duplicar.
  const { data: existingRows } = await supabase
    .from('events').select('recurrence_id, date').eq('org_id', orgId).not('recurrence_id', 'is', null);
  const existingKey = new Set(((existingRows ?? []) as { recurrence_id: string; date: string }[])
    .map((e) => `${e.recurrence_id}|${e.date}`));

  const created: GeneratedEventSummary[] = [];

  for (const rec of recurrences) {
    const dates = upcomingDatesForWeekday(rec.weekday).filter((d) => !existingKey.has(`${rec.id}|${d}`));
    for (const date of dates) {
      const { data: event, error: eventError } = await supabase.from('events').insert({
        org_id: orgId, name: rec.name, date, time: rec.time, arrival_time: rec.arrival_time,
        location: rec.location, color: rec.color, description: rec.description,
        observations: null, is_published: false, created_by: user.id, recurrence_id: rec.id,
      }).select('id').single();
      if (eventError) continue; // já pode existir (corrida entre pedidos) — ignora e segue

      const ministryIds = rec.event_recurrence_ministries.map((m) => m.ministry_id);
      await suggestScheduleForEvent(supabase, orgId, event.id, ministryIds, date, rec.time);
      await logEventActivity(supabase, orgId, event.id, user.id, [`gerou o evento a partir da recorrência "${rec.name}"`]);
      created.push({ date, eventId: event.id, recurrenceName: rec.name });
    }
  }

  return created;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = any;

/**
 * Sugere quem escalar em cada ministério: entre os membros ativos, exclui
 * quem está indisponível nessa data/hora e, quando duas pessoas têm
 * preferência "separado", mantém só a que há mais tempo não serve (fica
 * sempre reversível — o admin ajusta na revisão antes de publicar).
 */
async function suggestScheduleForEvent(
  supabase: SupabaseAny,
  orgId: string,
  eventId: string,
  ministryIds: string[],
  date: string,
  time: string,
): Promise<void> {
  if (ministryIds.length === 0) return;

  const { data: familyRows } = await supabase
    .from('family_relationships').select('user_id_1, user_id_2, preference')
    .eq('org_id', orgId).eq('status', 'accepted');
  const separatedPairs = ((familyRows ?? []) as { user_id_1: string; user_id_2: string; preference: FamilyPreference }[])
    .filter((r) => r.preference === 'separado');

  for (const ministryId of ministryIds) {
    const { data: memberRows } = await supabase
      .from('ministry_members').select('user_id').eq('ministry_id', ministryId);
    const candidateIds = ((memberRows ?? []) as { user_id: string }[]).map((m) => m.user_id);
    if (candidateIds.length === 0) {
      await supabase.from('event_ministries').insert({ event_id: eventId, ministry_id: ministryId });
      continue;
    }

    const { data: unavailRows } = await supabase
      .from('member_unavailability')
      .select('user_id, id, kind, start_date, end_date, weekday, nth, period, reason')
      .eq('org_id', orgId).in('user_id', candidateIds);
    const unavailByUser = new Map<string, UnavailabilityEntry[]>();
    for (const r of (unavailRows ?? []) as (UnavailabilityEntry & { user_id: string })[]) {
      const { user_id, ...entry } = r as unknown as UnavailabilityEntry & { user_id: string };
      const list = unavailByUser.get(user_id) ?? [];
      list.push(entry);
      unavailByUser.set(user_id, list);
    }

    let available = candidateIds.filter((uid) =>
      !findConflictingUnavailability(unavailByUser.get(uid), date, time),
    );

    // "Separado": entre cada par, fica só quem há mais tempo não serve.
    const { data: lastServedRows } = await supabase
      .from('event_schedules')
      .select('user_id, event_ministry:event_ministries!inner(event:events!inner(date, org_id))')
      .in('user_id', available);
    const lastServedByUser = new Map<string, string>(); // user_id -> data mais recente em que serviu
    for (const row of (lastServedRows ?? []) as unknown as
      { user_id: string; event_ministry: { event: { date: string; org_id: string } | null } | null }[]) {
      const ev = row.event_ministry?.event;
      if (!ev || ev.org_id !== orgId) continue;
      const prev = lastServedByUser.get(row.user_id);
      if (!prev || ev.date > prev) lastServedByUser.set(row.user_id, ev.date);
    }
    const availableSet = new Set(available);
    for (const pair of separatedPairs) {
      if (!availableSet.has(pair.user_id_1) || !availableSet.has(pair.user_id_2)) continue;
      const lastA = lastServedByUser.get(pair.user_id_1) ?? '';
      const lastB = lastServedByUser.get(pair.user_id_2) ?? '';
      // Remove quem serviu mais recentemente (prioriza quem há mais tempo não serve).
      const drop = lastA >= lastB ? pair.user_id_1 : pair.user_id_2;
      availableSet.delete(drop);
    }
    available = [...availableSet];

    const { data: em, error: emError } = await supabase
      .from('event_ministries').insert({ event_id: eventId, ministry_id: ministryId }).select().single();
    if (emError || available.length === 0) continue;

    const rows = available.map((userId) => ({ event_ministry_id: em.id, user_id: userId, functions: [] }));
    await supabase.from('event_schedules').insert(rows);
  }
}
