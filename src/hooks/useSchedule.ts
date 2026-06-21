'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { EventMinistry, EventSchedule, Ministry } from '@/types/models';

export function useEventMinistries(eventId: string | null) {
  return useQuery({
    queryKey: ['event-ministries', eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('event_ministries')
        .select('*, ministry:ministries(*)')
        .eq('event_id', eventId!);
      if (error) throw new Error(error.message);
      return data as (EventMinistry & { ministry: Ministry })[];
    },
  });
}

export function useEventSchedules(eventMinistryId: string | null) {
  return useQuery({
    queryKey: ['event-schedules', eventMinistryId],
    enabled: !!eventMinistryId,
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('event_schedules')
        .select('*, profile:profiles(*)')
        .eq('event_ministry_id', eventMinistryId!);
      if (error) throw new Error(error.message);
      return data as EventSchedule[];
    },
  });
}

export function useAddMinistryToEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventId, ministryId }: { eventId: string; ministryId: string }) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('event_ministries')
        .insert({ event_id: eventId, ministry_id: ministryId })
        .select().single();
      if (error) throw new Error(error.message);
      return data as EventMinistry;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['event-ministries', vars.eventId] });
    },
  });
}

export function useRemoveMinistryFromEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, eventId }: { id: string; eventId: string }) => {
      const supabase = createClient();
      const { error } = await supabase.from('event_ministries').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return eventId;
    },
    onSuccess: (eventId) => {
      qc.invalidateQueries({ queryKey: ['event-ministries', eventId] });
    },
  });
}

export function useAddPersonToSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventMinistryId, userId, functions }: {
      eventMinistryId: string; userId: string; functions: string[];
    }) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('event_schedules')
        .insert({ event_ministry_id: eventMinistryId, user_id: userId, functions })
        .select().single();
      if (error) throw new Error(error.message);
      return data as EventSchedule;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['event-schedules', data.event_ministry_id] });
    },
  });
}

export function useRemovePersonFromSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, eventMinistryId }: { id: string; eventMinistryId: string }) => {
      const supabase = createClient();
      const { error } = await supabase.from('event_schedules').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return eventMinistryId;
    },
    onSuccess: (eventMinistryId) => {
      qc.invalidateQueries({ queryKey: ['event-schedules', eventMinistryId] });
    },
  });
}

export function useConfirmSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, eventMinistryId, confirmed }: {
      id: string; eventMinistryId: string; confirmed: boolean;
    }) => {
      const supabase = createClient();
      const { error } = await supabase.from('event_schedules').update({ confirmed }).eq('id', id);
      if (error) throw new Error(error.message);
      return eventMinistryId;
    },
    onSuccess: (eventMinistryId) => {
      qc.invalidateQueries({ queryKey: ['event-schedules', eventMinistryId] });
    },
  });
}
