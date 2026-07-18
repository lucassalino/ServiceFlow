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

export interface EventTimelineItemInput { time: string; title: string }

export async function fetchEventSetupAction(eventId: string): Promise<{
  ministryIds: string[];
  membersByMinistry: Record<string, { userId: string; functions: string[] }[]>;
  songIds: string[];
  songKeys: Record<string, string>;
  timeline: EventTimelineItemInput[];
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
  const setlist = (rawSetlist ?? []) as { song_id: string; musical_key: string | null }[];

  const songKeys: Record<string, string> = {};
  for (const s of setlist) if (s.musical_key) songKeys[s.song_id] = s.musical_key;

  const { data: rawTimeline } = await supabase
    .from('event_timeline_items').select('time, title').eq('event_id', eventId).order('order_index');
  const timeline = (rawTimeline ?? []) as EventTimelineItemInput[];

  return {
    ministryIds,
    membersByMinistry,
    songIds: setlist.map((s) => s.song_id),
    songKeys,
    timeline,
  };
}

export async function replaceEventSetupAction(
  eventId: string,
  setup: { ministryId: string; members: { userId: string; functions: string[] }[] }[],
  songIds: string[],
  songKeys: Record<string, string> = {},
  timeline: EventTimelineItemInput[] = [],
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
    const rows = songIds.map((songId, index) => ({
      event_id: eventId, song_id: songId, order_index: index,
      musical_key: songKeys[songId] ?? null,
    }));
    const { error: slErr } = await admin.from('event_setlists').insert(rows);
    if (slErr) throw new Error(slErr.message);
  }

  await admin.from('event_timeline_items').delete().eq('event_id', eventId);
  if (timeline.length > 0) {
    const rows = timeline.map((item, index) => ({
      event_id: eventId, time: item.time, title: item.title, order_index: index,
    }));
    const { error: tlErr } = await admin.from('event_timeline_items').insert(rows);
    if (tlErr) throw new Error(tlErr.message);
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

export interface ScheduledContact {
  userId: string;
  name: string;
  phone: string | null;
  confirmed: boolean | null;
  ministries: string[];
}

/** Contactos das pessoas escaladas num evento (para enviar mensagens de WhatsApp). */
export async function fetchEventScheduledContactsAction(
  eventId: string,
): Promise<ScheduledContact[]> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  const admin = getAdmin();

  const { data: eventMins } = await admin
    .from('event_ministries').select('id, ministry:ministries(name)').eq('event_id', eventId);
  const emList = (eventMins ?? []) as unknown as { id: string; ministry: { name: string } | null }[];
  const emIds = emList.map((em) => em.id);
  if (emIds.length === 0) return [];
  const ministryNameByEm = new Map(emList.map((em) => [em.id, em.ministry?.name ?? '']));

  const { data: schedules } = await admin
    .from('event_schedules')
    .select('user_id, confirmed, event_ministry_id, profile:profiles(full_name, phone)')
    .in('event_ministry_id', emIds);

  type Row = {
    user_id: string; confirmed: boolean | null; event_ministry_id: string;
    profile: { full_name: string; phone: string | null } | null;
  };

  const byUser = new Map<string, ScheduledContact & { _ministries: Set<string> }>();
  for (const s of (schedules ?? []) as unknown as Row[]) {
    let entry = byUser.get(s.user_id);
    if (!entry) {
      entry = {
        userId: s.user_id,
        name: s.profile?.full_name ?? 'Sem nome',
        phone: s.profile?.phone ?? null,
        confirmed: s.confirmed,
        ministries: [],
        _ministries: new Set<string>(),
      };
      byUser.set(s.user_id, entry);
    }
    const mn = ministryNameByEm.get(s.event_ministry_id);
    if (mn) entry._ministries.add(mn);
  }

  return [...byUser.values()].map(({ _ministries, ...c }) => ({ ...c, ministries: [..._ministries] }));
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

export async function fetchEventSetlistAction(eventId: string): Promise<(Song & { order_index: number; event_key: string | null })[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('event_setlists')
    .select('order_index, musical_key, song:songs(*)')
    .eq('event_id', eventId)
    .order('order_index');
  if (error) throw new Error(error.message);
  return ((data ?? []) as { order_index: number; musical_key: string | null; song: Song }[])
    .map(({ order_index, musical_key, song }) => ({ ...song, order_index, event_key: musical_key }));
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
  songKeys: Record<string, string> = {},
): Promise<void> {
  if (songIds.length === 0) return;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  const admin = getAdmin();
  const rows = songIds.map((songId, index) => ({
    event_id: eventId, song_id: songId, order_index: index,
    musical_key: songKeys[songId] ?? null,
  }));
  const { error } = await admin.from('event_setlists').insert(rows);
  if (error) throw new Error(error.message);
}

export async function fetchEventTimelineAction(eventId: string): Promise<EventTimelineItemInput[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('event_timeline_items')
    .select('time, title')
    .eq('event_id', eventId)
    .order('order_index');
  if (error) throw new Error(error.message);
  return (data ?? []) as EventTimelineItemInput[];
}

export async function setupEventTimelineAction(
  eventId: string,
  items: EventTimelineItemInput[],
): Promise<void> {
  if (items.length === 0) return;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  const admin = getAdmin();
  const rows = items.map((item, index) => ({
    event_id: eventId, time: item.time, title: item.title, order_index: index,
  }));
  const { error } = await admin.from('event_timeline_items').insert(rows);
  if (error) throw new Error(error.message);
}

export interface ServiceHistoryEntry {
  eventId: string;
  eventName: string;
  date: string;
  ministryName: string;
  functions: string[];
}

export interface ServiceHistoryMonth {
  month: string;  // "2026-07"
  label: string;  // "Julho de 2026"
  count: number;
}

export interface MyServiceHistory {
  totalAllTime: number;
  byMonth: ServiceHistoryMonth[]; // desc, só meses com pelo menos 1 vez
  entries: ServiceHistoryEntry[]; // desc, todo o histórico (para filtrar por mês escolhido)
}

/** Histórico de participação do próprio utilizador nesta organização (quantas vezes serviu, por mês e ao todo). */
export async function fetchMyServiceHistoryAction(userId: string, orgId: string): Promise<MyServiceHistory> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('event_schedules')
    .select('id, functions, event_ministry:event_ministries(ministry:ministries(name), event:events(id, name, date, org_id))')
    .eq('user_id', userId);
  if (error) throw new Error(error.message);

  type Row = {
    id: string;
    functions: string[];
    event_ministry: {
      ministry: { name: string } | null;
      event: { id: string; name: string; date: string; org_id: string } | null;
    } | null;
  };

  const entries: ServiceHistoryEntry[] = ((data ?? []) as unknown as Row[])
    .filter((r) => r.event_ministry?.event?.org_id === orgId)
    .map((r) => ({
      eventId: r.event_ministry!.event!.id,
      eventName: r.event_ministry!.event!.name,
      date: r.event_ministry!.event!.date,
      ministryName: r.event_ministry!.ministry?.name ?? '',
      functions: r.functions,
    }))
    .sort((a, b) => b.date.localeCompare(a.date));

  const countByMonth = new Map<string, number>();
  for (const e of entries) {
    const month = e.date.slice(0, 7); // "YYYY-MM"
    countByMonth.set(month, (countByMonth.get(month) ?? 0) + 1);
  }
  const byMonth: ServiceHistoryMonth[] = [...countByMonth.entries()]
    .map(([month, count]) => {
      const rawLabel = new Date(month + '-01T00:00:00').toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });
      return { month, label: rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1), count };
    })
    .sort((a, b) => b.month.localeCompare(a.month));

  return {
    totalAllTime: entries.length,
    byMonth,
    entries,
  };
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
