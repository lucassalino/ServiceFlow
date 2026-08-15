'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

function getAdmin() {
  return createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export interface CheckinStatus {
  scheduleId: string;
  eventId: string;
  eventName: string;
  eventTime: string;
  checkedInAt: string | null;
  checkedOutAt: string | null;
}

function todayISODate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Encontra o evento de hoje em que a pessoa autenticada está escalada (o mais
 * próximo da hora atual, se houver mais do que um) — usado pela página de
 * check-in aberta ao ler o QR code.
 */
export async function fetchMyCheckinStatusAction(orgId: string): Promise<CheckinStatus | null> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  const admin = getAdmin();

  const { data: membership } = await admin
    .from('organization_members').select('id')
    .eq('org_id', orgId).eq('user_id', user.id).maybeSingle();
  if (!membership) throw new Error('Não pertences a esta organização');

  const today = todayISODate();
  const { data: events } = await admin
    .from('events').select('id, name, time').eq('org_id', orgId).eq('date', today);
  const todaysEvents = (events ?? []) as { id: string; name: string; time: string }[];
  if (todaysEvents.length === 0) return null;

  const { data: eventMins } = await admin
    .from('event_ministries').select('id, event_id').in('event_id', todaysEvents.map((e) => e.id));
  const emList = (eventMins ?? []) as { id: string; event_id: string }[];
  if (emList.length === 0) return null;

  const { data: schedules } = await admin
    .from('event_schedules')
    .select('id, event_ministry_id, checked_in_at, checked_out_at')
    .eq('user_id', user.id).in('event_ministry_id', emList.map((em) => em.id));
  const myScheds = (schedules ?? []) as { id: string; event_ministry_id: string; checked_in_at: string | null; checked_out_at: string | null }[];
  if (myScheds.length === 0) return null;

  const emById = new Map(emList.map((em) => [em.id, em]));
  const eventById = new Map(todaysEvents.map((e) => [e.id, e]));

  // Se houver mais do que um evento hoje, escolhe o mais próximo da hora atual.
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  function minutesOf(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  let best: { sched: typeof myScheds[number]; event: { id: string; name: string; time: string } } | null = null;
  let bestDiff = Infinity;
  for (const sched of myScheds) {
    const em = emById.get(sched.event_ministry_id);
    const event = em ? eventById.get(em.event_id) : null;
    if (!event) continue;
    const diff = Math.abs(minutesOf(event.time) - nowMinutes);
    if (diff < bestDiff) { bestDiff = diff; best = { sched, event }; }
  }
  if (!best) return null;

  return {
    scheduleId: best.sched.id,
    eventId: best.event.id,
    eventName: best.event.name,
    eventTime: best.event.time,
    checkedInAt: best.sched.checked_in_at,
    checkedOutAt: best.sched.checked_out_at,
  };
}

export interface CheckinOverviewPerson {
  scheduleId: string;
  eventMinistryId: string;
  userId: string;
  name: string;
  avatarUrl: string | null;
  ministryName: string;
  confirmed: boolean | null;
  checkedInAt: string | null;
  checkedOutAt: string | null;
}

export interface CheckinOverviewEvent {
  eventId: string;
  eventName: string;
  eventTime: string;
  people: CheckinOverviewPerson[];
}

/** Visão de gestão do check-in para admin/líder: todos os eventos de hoje e quem já entrou/saiu. */
export async function fetchTodayCheckinOverviewAction(orgId: string): Promise<CheckinOverviewEvent[]> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  const admin = getAdmin();

  const { data: membership } = await admin
    .from('organization_members').select('role')
    .eq('org_id', orgId).eq('user_id', user.id).maybeSingle();
  const role = (membership as { role?: string } | null)?.role;
  if (role !== 'admin' && role !== 'leader') throw new Error('Só admins e líderes podem gerir o check-in');

  const today = todayISODate();
  const { data: events } = await admin
    .from('events').select('id, name, time').eq('org_id', orgId).eq('date', today).order('time');
  const todaysEvents = (events ?? []) as { id: string; name: string; time: string }[];
  if (todaysEvents.length === 0) return [];

  const { data: eventMins } = await admin
    .from('event_ministries').select('id, event_id, ministry:ministries(name)')
    .in('event_id', todaysEvents.map((e) => e.id));
  const emList = (eventMins ?? []) as unknown as { id: string; event_id: string; ministry: { name: string } | null }[];
  if (emList.length === 0) return todaysEvents.map((e) => ({ eventId: e.id, eventName: e.name, eventTime: e.time, people: [] }));

  const { data: schedules } = await admin
    .from('event_schedules')
    .select('id, event_ministry_id, user_id, confirmed, checked_in_at, checked_out_at, profile:profiles(full_name, avatar_url)')
    .in('event_ministry_id', emList.map((em) => em.id));
  type SchedRow = {
    id: string; event_ministry_id: string; user_id: string; confirmed: boolean | null;
    checked_in_at: string | null; checked_out_at: string | null;
    profile: { full_name: string; avatar_url: string | null } | null;
  };
  const allScheds = (schedules ?? []) as unknown as SchedRow[];

  const emById = new Map(emList.map((em) => [em.id, em]));
  const peopleByEvent = new Map<string, CheckinOverviewPerson[]>();
  for (const s of allScheds) {
    const em = emById.get(s.event_ministry_id);
    if (!em) continue;
    const list = peopleByEvent.get(em.event_id) ?? [];
    list.push({
      scheduleId: s.id,
      eventMinistryId: s.event_ministry_id,
      userId: s.user_id,
      name: s.profile?.full_name ?? 'Sem nome',
      avatarUrl: s.profile?.avatar_url ?? null,
      ministryName: em.ministry?.name ?? '',
      confirmed: s.confirmed,
      checkedInAt: s.checked_in_at,
      checkedOutAt: s.checked_out_at,
    });
    peopleByEvent.set(em.event_id, list);
  }

  return todaysEvents.map((e) => ({
    eventId: e.id,
    eventName: e.name,
    eventTime: e.time,
    people: (peopleByEvent.get(e.id) ?? []).sort((a, b) => a.name.localeCompare(b.name)),
  }));
}

/**
 * Faz check-in/check-out da própria pessoa com um simples botão — sem QR nem
 * geolocalização. O líder/admin marca os voluntários pela vista de gestão.
 */
export async function checkInSelfAction(scheduleId: string, checkedIn: boolean): Promise<void> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  const admin = getAdmin();

  const { data: schedule, error: fetchError } = await admin
    .from('event_schedules')
    .select('user_id')
    .eq('id', scheduleId).single();
  if (fetchError || !schedule) throw new Error('Escala não encontrada');
  if ((schedule as { user_id: string }).user_id !== user.id) {
    throw new Error('Só podes confirmar a tua própria presença');
  }

  const now = new Date().toISOString();
  const patch = checkedIn ? { checked_in_at: now } : { checked_out_at: now };
  const { error } = await admin.from('event_schedules').update(patch).eq('id', scheduleId);
  if (error) throw new Error(error.message);
}

/**
 * [DESATIVADO por agora — o fluxo de leitura de QR/câmara está comentado na UI;
 * o check-in faz-se por botão via checkInSelfAction. Mantido para reativação futura.]
 * Faz check-in/check-out da própria pessoa depois de ler, dentro da app, o QR
 * code físico afixado no local — a leitura é a prova de presença (substitui
 * geolocalização). O texto lido tem de corresponder ao link de check-in
 * desta organização.
 */
export async function checkInWithScanAction(
  scheduleId: string,
  checkedIn: boolean,
  scannedText: string,
): Promise<void> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  const admin = getAdmin();

  const { data: schedule, error: fetchError } = await admin
    .from('event_schedules')
    .select('user_id, event_ministry:event_ministries(event:events(org_id))')
    .eq('id', scheduleId).single();
  if (fetchError || !schedule) throw new Error('Escala não encontrada');
  const row = schedule as unknown as { user_id: string; event_ministry: { event: { org_id: string } | null } | null };
  if (row.user_id !== user.id) throw new Error('Só podes confirmar a tua própria presença');
  const orgId = row.event_ministry?.event?.org_id;
  if (!orgId) throw new Error('Evento não encontrado');

  if (!scannedText.includes(`/${orgId}/checkin`)) {
    throw new Error('Esse QR code não é o de check-in desta organização.');
  }

  const now = new Date().toISOString();
  if (checkedIn) {
    const { error } = await admin.from('event_schedules').update({ checked_in_at: now }).eq('id', scheduleId);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await admin.from('event_schedules').update({ checked_out_at: now }).eq('id', scheduleId);
    if (error) throw new Error(error.message);
  }
}
