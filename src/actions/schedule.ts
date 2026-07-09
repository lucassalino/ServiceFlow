'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import type { EventMinistry, EventSchedule, Ministry, Song } from '@/types/models';
import type { Database } from '@/types/database';

function getAdmin() {
  return createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function fetchEventMinistriesAction(
  eventId: string,
): Promise<(EventMinistry & { ministry: Ministry })[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('event_ministries')
    .select('*, ministry:ministries(*)').eq('event_id', eventId);
  if (error) throw new Error(error.message);
  return data as (EventMinistry & { ministry: Ministry })[];
}

export async function fetchEventSchedulesAction(eventMinistryId: string): Promise<EventSchedule[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('event_schedules')
    .select('*, profile:profiles(*)').eq('event_ministry_id', eventMinistryId);
  if (error) throw new Error(error.message);
  return data as EventSchedule[];
}

export async function fetchEventSetupAction(eventId: string): Promise<{
  ministryIds: string[];
  membersByMinistry: Record<string, { userId: string; functions: string[] }[]>;
  songIds: string[];
}> {
  const supabase = await createClient();
  const { data: rawMins, error: minsErr } = await supabase
    .from('event_ministries').select('*').eq('event_id', eventId);
  if (minsErr) throw new Error(minsErr.message);

  const eventMins = (rawMins ?? []) as { id: string; ministry_id: string }[];
  const ministryIds: string[] = [];
  const membersByMinistry: Record<string, { userId: string; functions: string[] }[]> = {};

  for (const em of eventMins) {
    ministryIds.push(em.ministry_id);
    const { data: rawSched } = await supabase
      .from('event_schedules').select('*').eq('event_ministry_id', em.id);
    const schedules = (rawSched ?? []) as { user_id: string; functions: string[] }[];
    membersByMinistry[em.ministry_id] = schedules.map((s) => ({
      userId: s.user_id,
      functions: s.functions ?? [],
    }));
  }

  const { data: rawSetlist } = await supabase
    .from('event_setlists').select('*').eq('event_id', eventId).order('order_index');
  const setlist = (rawSetlist ?? []) as { song_id: string }[];

  return {
    ministryIds,
    membersByMinistry,
    songIds: setlist.map((s) => s.song_id),
  };
}

export async function replaceEventSetupAction(
  eventId: string,
  setup: { ministryId: string; members: { userId: string; functions: string[] }[] }[],
  songIds: string[],
): Promise<void> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  const admin = getAdmin();

  const { data: existingMins } = await admin
    .from('event_ministries').select('id').eq('event_id', eventId);
  if (existingMins && existingMins.length > 0) {
    await admin.from('event_schedules').delete()
      .in('event_ministry_id', existingMins.map((m) => m.id));
  }
  await admin.from('event_ministries').delete().eq('event_id', eventId);

  for (const { ministryId, members } of setup) {
    const { data: em, error: emError } = await admin
      .from('event_ministries').insert({ event_id: eventId, ministry_id: ministryId })
      .select().single();
    if (emError) throw new Error(emError.message);
    if (members.length > 0) {
      const rows = members.map(({ userId, functions }) => ({
        event_ministry_id: em.id, user_id: userId, functions,
      }));
      const { error: sErr } = await admin.from('event_schedules').insert(rows);
      if (sErr) throw new Error(sErr.message);
    }
  }

  await admin.from('event_setlists').delete().eq('event_id', eventId);
  if (songIds.length > 0) {
    const rows = songIds.map((songId, index) => ({ event_id: eventId, song_id: songId, order_index: index }));
    const { error: slErr } = await admin.from('event_setlists').insert(rows);
    if (slErr) throw new Error(slErr.message);
  }
}

export async function addMinistryToEventAction(
  eventId: string,
  ministryId: string,
): Promise<EventMinistry> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  const admin = getAdmin();
  const { data, error } = await admin.from('event_ministries')
    .insert({ event_id: eventId, ministry_id: ministryId }).select().single();
  if (error) throw new Error(error.message);
  return data as EventMinistry;
}

export async function removeMinistryFromEventAction(id: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  const admin = getAdmin();
  const { error } = await admin.from('event_ministries').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function addPersonToScheduleAction(
  eventMinistryId: string,
  userId: string,
  functions: string[],
): Promise<EventSchedule> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  const admin = getAdmin();
  const { data, error } = await admin.from('event_schedules')
    .insert({ event_ministry_id: eventMinistryId, user_id: userId, functions })
    .select().single();
  if (error) throw new Error(error.message);
  return data as EventSchedule;
}

export async function removePersonFromScheduleAction(id: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  const admin = getAdmin();
  const { error } = await admin.from('event_schedules').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/** Contactos das pessoas escaladas num evento (para enviar mensagens de WhatsApp). */
export async function fetchEventScheduledContactsAction(
  eventId: string,
): Promise<{ userId: string; name: string; phone: string | null; confirmed: boolean | null }[]> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  const admin = getAdmin();

  const { data: eventMins } = await admin
    .from('event_ministries').select('id').eq('event_id', eventId);
  const emIds = (eventMins ?? []).map((em: { id: string }) => em.id);
  if (emIds.length === 0) return [];

  const { data: schedules } = await admin
    .from('event_schedules')
    .select('user_id, confirmed, profile:profiles(full_name, phone)')
    .in('event_ministry_id', emIds);

  type Row = { user_id: string; confirmed: boolean | null; profile: { full_name: string; phone: string | null } | null };
  const seen = new Set<string>();
  const result: { userId: string; name: string; phone: string | null; confirmed: boolean | null }[] = [];
  for (const s of (schedules ?? []) as unknown as Row[]) {
    if (seen.has(s.user_id)) continue;
    seen.add(s.user_id);
    result.push({
      userId: s.user_id,
      name: s.profile?.full_name ?? 'Sem nome',
      phone: s.profile?.phone ?? null,
      confirmed: s.confirmed,
    });
  }
  return result;
}

export async function confirmScheduleAction(
  id: string,
  confirmed: boolean,
): Promise<void> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  const admin = getAdmin();

  // Só a própria pessoa escalada pode confirmar/alterar a sua presença.
  const { data: schedule, error: fetchError } = await admin
    .from('event_schedules').select('user_id').eq('id', id).single();
  if (fetchError || !schedule) throw new Error('Escala não encontrada');
  if (schedule.user_id !== user.id) {
    throw new Error('Só podes confirmar a tua própria presença');
  }

  const { error } = await admin.from('event_schedules').update({ confirmed }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function fetchEventSetlistAction(eventId: string): Promise<(Song & { order_index: number })[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('event_setlists')
    .select('order_index, song:songs(*)')
    .eq('event_id', eventId)
    .order('order_index');
  if (error) throw new Error(error.message);
  return ((data ?? []) as { order_index: number; song: Song }[])
    .map(({ order_index, song }) => ({ ...song, order_index }));
}

export async function updateEventScheduleAction(id: string, functions: string[]): Promise<void> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  const admin = getAdmin();
  const { error } = await admin.from('event_schedules').update({ functions }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function setupEventSetlistAction(
  eventId: string,
  songIds: string[],
): Promise<void> {
  if (songIds.length === 0) return;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  const admin = getAdmin();
  const rows = songIds.map((songId, index) => ({
    event_id: eventId, song_id: songId, order_index: index,
  }));
  const { error } = await admin.from('event_setlists').insert(rows);
  if (error) throw new Error(error.message);
}

export async function setupEventScheduleAction(
  eventId: string,
  setup: { ministryId: string; members: { userId: string; functions: string[] }[] }[],
): Promise<void> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  const admin = getAdmin();
  for (const { ministryId, members } of setup) {
    const { data: em, error: emError } = await admin.from('event_ministries')
      .insert({ event_id: eventId, ministry_id: ministryId }).select().single();
    if (emError) throw new Error(emError.message);
    if (members.length === 0) continue;
    const rows = members.map(({ userId, functions }) => ({
      event_ministry_id: em.id, user_id: userId, functions,
    }));
    const { error: schedError } = await admin.from('event_schedules').insert(rows);
    if (schedError) throw new Error(schedError.message);
  }
}
