'use server';

import { createClient } from '@/lib/supabase/server';
import type { EventMinistry, EventSchedule, Ministry, Song } from '@/types/models';
import {
  checkMinistryUnlocked, checkMemberUnlockedByUserId,
  getEventOrgId, getEventMinistryOrgId, type LockGuarded,
} from '@/lib/downgrade-lock';

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
  songNotes: Record<string, string>;
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
  const setlist = (rawSetlist ?? []) as { song_id: string; musical_key: string | null; note: string | null }[];

  const songKeys: Record<string, string> = {};
  const songNotes: Record<string, string> = {};
  for (const s of setlist) {
    if (s.musical_key) songKeys[s.song_id] = s.musical_key;
    if (s.note) songNotes[s.song_id] = s.note;
  }

  const { data: rawTimeline } = await supabase
    .from('event_timeline_items').select('time, title').eq('event_id', eventId).order('order_index');
  const timeline = (rawTimeline ?? []) as EventTimelineItemInput[];

  return {
    ministryIds,
    membersByMinistry,
    songIds: setlist.map((s) => s.song_id),
    songKeys,
    songNotes,
    timeline,
  };
}

export async function replaceEventSetupAction(
  eventId: string,
  setup: { ministryId: string; members: { userId: string; functions: string[] }[] }[],
  songIds: string[],
  songKeys: Record<string, string> = {},
  timeline: EventTimelineItemInput[] = [],
  songNotes: Record<string, string> = {},
): Promise<LockGuarded<void>> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');

  const orgId = await getEventOrgId(supabase, eventId);
  for (const { ministryId, members } of setup) {
    const ministryBlocked = await checkMinistryUnlocked(supabase, orgId, ministryId);
    if (ministryBlocked) return ministryBlocked;
    for (const { userId } of members) {
      const memberBlocked = await checkMemberUnlockedByUserId(supabase, orgId, userId);
      if (memberBlocked) return memberBlocked;
    }
  }

  const { data: existingMins } = await supabase
    .from('event_ministries').select('id').eq('event_id', eventId);
  if (existingMins && existingMins.length > 0) {
    await supabase.from('event_schedules').delete()
      .in('event_ministry_id', existingMins.map((m) => m.id));
  }
  await supabase.from('event_ministries').delete().eq('event_id', eventId);

  for (const { ministryId, members } of setup) {
    const { data: em, error: emError } = await supabase
      .from('event_ministries').insert({ event_id: eventId, ministry_id: ministryId })
      .select().single();
    if (emError) throw new Error(emError.message);
    if (members.length > 0) {
      const rows = members.map(({ userId, functions }) => ({
        event_ministry_id: em.id, user_id: userId, functions,
      }));
      const { error: sErr } = await supabase.from('event_schedules').insert(rows);
      if (sErr) throw new Error(sErr.message);
    }
  }

  await supabase.from('event_setlists').delete().eq('event_id', eventId);
  if (songIds.length > 0) {
    const rows = songIds.map((songId, index) => ({
      event_id: eventId, song_id: songId, order_index: index,
      musical_key: songKeys[songId] ?? null,
      note: songNotes[songId] ?? null,
    }));
    const { error: slErr } = await supabase.from('event_setlists').insert(rows);
    if (slErr) throw new Error(slErr.message);
  }

  await supabase.from('event_timeline_items').delete().eq('event_id', eventId);
  if (timeline.length > 0) {
    const rows = timeline.map((item, index) => ({
      event_id: eventId, time: item.time, title: item.title, order_index: index,
    }));
    const { error: tlErr } = await supabase.from('event_timeline_items').insert(rows);
    if (tlErr) throw new Error(tlErr.message);
  }
  return { ok: true, data: undefined };
}

export async function addMinistryToEventAction(
  eventId: string,
  ministryId: string,
): Promise<LockGuarded<EventMinistry>> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  const orgId = await getEventOrgId(supabase, eventId);
  const blocked = await checkMinistryUnlocked(supabase, orgId, ministryId);
  if (blocked) return blocked;
  const { data, error } = await supabase.from('event_ministries')
    .insert({ event_id: eventId, ministry_id: ministryId }).select().single();
  if (error) throw new Error(error.message);
  return { ok: true, data: data as EventMinistry };
}

export async function removeMinistryFromEventAction(id: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  const { error } = await supabase.from('event_ministries').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function addPersonToScheduleAction(
  eventMinistryId: string,
  userId: string,
  functions: string[],
): Promise<LockGuarded<EventSchedule>> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  const { orgId, ministryId } = await getEventMinistryOrgId(supabase, eventMinistryId);
  const ministryBlocked = await checkMinistryUnlocked(supabase, orgId, ministryId);
  if (ministryBlocked) return ministryBlocked;
  const memberBlocked = await checkMemberUnlockedByUserId(supabase, orgId, userId);
  if (memberBlocked) return memberBlocked;
  const { data, error } = await supabase.from('event_schedules')
    .insert({ event_ministry_id: eventMinistryId, user_id: userId, functions })
    .select().single();
  if (error) throw new Error(error.message);
  return { ok: true, data: data as EventSchedule };
}

export async function removePersonFromScheduleAction(id: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  const { error } = await supabase.from('event_schedules').delete().eq('id', id);
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

  const { data: eventMins } = await supabase
    .from('event_ministries').select('id, ministry:ministries(name)').eq('event_id', eventId);
  const emList = (eventMins ?? []) as unknown as { id: string; ministry: { name: string } | null }[];
  const emIds = emList.map((em) => em.id);
  if (emIds.length === 0) return [];
  const ministryNameByEm = new Map(emList.map((em) => [em.id, em.ministry?.name ?? '']));

  const { data: schedules } = await supabase
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

  // Só a própria pessoa escalada pode confirmar/alterar a sua presença —
  // reforçado tanto aqui como pela RLS ("event_schedules: own can update confirmed").
  const { data: schedule, error: fetchError } = await supabase
    .from('event_schedules').select('user_id').eq('id', id).single();
  if (fetchError || !schedule) throw new Error('Escala não encontrada');
  if (schedule.user_id !== user.id) {
    throw new Error('Só podes confirmar a tua própria presença');
  }

  const { error } = await supabase.from('event_schedules').update({ confirmed }).eq('id', id);
  if (error) throw new Error(error.message);
}

/** Marca/desmarca o check-in de presença no dia do evento. A própria pessoa ou admin/líder podem fazê-lo. */
export async function checkInScheduleAction(id: string, checkedIn: boolean): Promise<void> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');

  const { data: schedule, error: fetchError } = await supabase
    .from('event_schedules')
    .select('user_id, event_ministry:event_ministries(event:events(org_id))')
    .eq('id', id).single();
  if (fetchError || !schedule) throw new Error('Escala não encontrada');
  const row = schedule as unknown as { user_id: string; event_ministry: { event: { org_id: string } | null } | null };
  const orgId = row.event_ministry?.event?.org_id;
  if (!orgId) throw new Error('Evento não encontrado');

  if (row.user_id !== user.id) {
    const { data: membership } = await supabase
      .from('organization_members').select('role')
      .eq('org_id', orgId).eq('user_id', user.id).maybeSingle();
    const role = (membership as { role?: string } | null)?.role;
    if (role !== 'admin' && role !== 'leader') {
      throw new Error('Só admins e líderes podem marcar presença de outra pessoa');
    }
  }

  const { error } = await supabase.from('event_schedules')
    .update({ checked_in_at: checkedIn ? new Date().toISOString() : null }).eq('id', id);
  if (error) throw new Error(error.message);
}

export interface EventAssignment { userId: string; ministryId: string; ministryName: string }

/** Todas as pessoas escaladas num evento, em todos os ministérios — usado para detetar conflitos de escala. */
export async function fetchEventAssignmentsAction(eventId: string): Promise<EventAssignment[]> {
  const supabase = await createClient();
  const { data: eventMins } = await supabase
    .from('event_ministries').select('id, ministry_id, ministry:ministries(name)').eq('event_id', eventId);
  const emList = (eventMins ?? []) as unknown as { id: string; ministry_id: string; ministry: { name: string } | null }[];
  const emIds = emList.map((em) => em.id);
  if (emIds.length === 0) return [];
  const emById = new Map(emList.map((em) => [em.id, em]));

  const { data: schedules } = await supabase
    .from('event_schedules').select('user_id, event_ministry_id').in('event_ministry_id', emIds);

  return ((schedules ?? []) as { user_id: string; event_ministry_id: string }[]).map((s) => {
    const em = emById.get(s.event_ministry_id)!;
    return { userId: s.user_id, ministryId: em.ministry_id, ministryName: em.ministry?.name ?? '' };
  });
}

export async function fetchEventSetlistAction(eventId: string): Promise<(Song & { order_index: number; event_key: string | null; event_note: string | null })[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('event_setlists')
    .select('order_index, musical_key, note, song:songs(*)')
    .eq('event_id', eventId)
    .order('order_index');
  if (error) throw new Error(error.message);
  return ((data ?? []) as { order_index: number; musical_key: string | null; note: string | null; song: Song }[])
    .map(({ order_index, musical_key, note, song }) => ({ ...song, order_index, event_key: musical_key, event_note: note }));
}

/** Reordena a setlist de um evento (drag-and-drop no ecrã de detalhe). Admin/líder apenas. */
export async function reorderEventSetlistAction(eventId: string, orderedSongIds: string[]): Promise<void> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');

  const orgId = await getEventOrgId(supabase, eventId);
  const { data: membership } = await supabase
    .from('organization_members').select('role')
    .eq('org_id', orgId).eq('user_id', user.id).maybeSingle();
  const role = (membership as { role?: string } | null)?.role;
  if (role !== 'admin' && role !== 'leader') throw new Error('Só admins e líderes podem reordenar a setlist');

  await Promise.all(orderedSongIds.map((songId, index) =>
    supabase.from('event_setlists').update({ order_index: index }).eq('event_id', eventId).eq('song_id', songId),
  ));
}

export async function updateEventScheduleAction(id: string, functions: string[]): Promise<void> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  const { error } = await supabase.from('event_schedules').update({ functions }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function setupEventSetlistAction(
  eventId: string,
  songIds: string[],
  songKeys: Record<string, string> = {},
  songNotes: Record<string, string> = {},
): Promise<void> {
  if (songIds.length === 0) return;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  const rows = songIds.map((songId, index) => ({
    event_id: eventId, song_id: songId, order_index: index,
    musical_key: songKeys[songId] ?? null,
    note: songNotes[songId] ?? null,
  }));
  const { error } = await supabase.from('event_setlists').insert(rows);
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
  const rows = items.map((item, index) => ({
    event_id: eventId, time: item.time, title: item.title, order_index: index,
  }));
  const { error } = await supabase.from('event_timeline_items').insert(rows);
  if (error) throw new Error(error.message);
}

export async function setupEventScheduleAction(
  eventId: string,
  setup: { ministryId: string; members: { userId: string; functions: string[] }[] }[],
): Promise<LockGuarded<void>> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  const orgId = await getEventOrgId(supabase, eventId);
  for (const { ministryId, members } of setup) {
    const ministryBlocked = await checkMinistryUnlocked(supabase, orgId, ministryId);
    if (ministryBlocked) return ministryBlocked;
    for (const { userId } of members) {
      const memberBlocked = await checkMemberUnlockedByUserId(supabase, orgId, userId);
      if (memberBlocked) return memberBlocked;
    }
    const { data: em, error: emError } = await supabase.from('event_ministries')
      .insert({ event_id: eventId, ministry_id: ministryId }).select().single();
    if (emError) throw new Error(emError.message);
    if (members.length === 0) continue;
    const rows = members.map(({ userId, functions }) => ({
      event_ministry_id: em.id, user_id: userId, functions,
    }));
    const { error: schedError } = await supabase.from('event_schedules').insert(rows);
    if (schedError) throw new Error(schedError.message);
  }
  return { ok: true, data: undefined };
}
