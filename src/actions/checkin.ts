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
  orgHasLocation: boolean;
  orgRadiusMeters: number;
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

  const { data: org } = await admin
    .from('organizations').select('checkin_latitude, checkin_longitude, checkin_radius_meters')
    .eq('id', orgId).single();
  if (!org) throw new Error('Organização não encontrada');

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
    orgHasLocation: org.checkin_latitude !== null && org.checkin_longitude !== null,
    orgRadiusMeters: org.checkin_radius_meters,
  };
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Faz check-in/check-out da própria pessoa via QR code, validando que está
 * dentro do raio definido para a organização (quando configurado).
 */
export async function checkInWithLocationAction(
  scheduleId: string,
  checkedIn: boolean,
  location: { latitude: number; longitude: number } | null,
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

  const { data: org } = await admin
    .from('organizations').select('checkin_latitude, checkin_longitude, checkin_radius_meters')
    .eq('id', orgId).single();

  if (org && org.checkin_latitude !== null && org.checkin_longitude !== null) {
    if (!location) throw new Error('Não conseguimos aceder à tua localização. Ativa o GPS e tenta novamente.');
    const distance = haversineMeters(location.latitude, location.longitude, org.checkin_latitude, org.checkin_longitude);
    if (distance > org.checkin_radius_meters) {
      throw new Error(`Estás a ${Math.round(distance)}m do local — precisa estar a menos de ${org.checkin_radius_meters}m para confirmar presença.`);
    }
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
