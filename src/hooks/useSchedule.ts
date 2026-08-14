'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { EventMinistry, EventSchedule, Ministry, Song } from '@/types/models';
import {
  fetchEventMinistriesAction,
  fetchEventSchedulesAction,
  fetchEventSetlistAction,
  fetchEventTimelineAction,
  addMinistryToEventAction,
  removeMinistryFromEventAction,
  addPersonToScheduleAction,
  removePersonFromScheduleAction,
  confirmScheduleAction,
  checkInScheduleAction,
  fetchEventAssignmentsAction,
  updateEventScheduleAction,
  reorderEventSetlistAction,
} from '@/actions/schedule';
import { unwrapLockGuarded } from '@/lib/downgrade-lock';

export function useEventMinistries(eventId: string | null) {
  return useQuery({
    queryKey: ['event-ministries', eventId],
    enabled: !!eventId,
    queryFn: () => fetchEventMinistriesAction(eventId!),
  });
}

export function useEventSchedules(eventMinistryId: string | null) {
  return useQuery({
    queryKey: ['event-schedules', eventMinistryId],
    enabled: !!eventMinistryId,
    queryFn: () => fetchEventSchedulesAction(eventMinistryId!),
  });
}

export function useAddMinistryToEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, ministryId }: { eventId: string; ministryId: string }) =>
      addMinistryToEventAction(eventId, ministryId).then(unwrapLockGuarded),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['event-ministries', vars.eventId] });
    },
  });
}

export function useRemoveMinistryFromEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, eventId }: { id: string; eventId: string }) =>
      removeMinistryFromEventAction(id).then(() => eventId),
    onSuccess: (eventId) => {
      qc.invalidateQueries({ queryKey: ['event-ministries', eventId] });
    },
  });
}

export function useAddPersonToSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventMinistryId, userId, functions }: {
      eventMinistryId: string; userId: string; functions: string[];
    }) => addPersonToScheduleAction(eventMinistryId, userId, functions).then(unwrapLockGuarded),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['event-schedules', data.event_ministry_id] });
    },
  });
}

export function useRemovePersonFromSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, eventMinistryId }: { id: string; eventMinistryId: string }) =>
      removePersonFromScheduleAction(id).then(() => eventMinistryId),
    onSuccess: (eventMinistryId) => {
      qc.invalidateQueries({ queryKey: ['event-schedules', eventMinistryId] });
    },
  });
}

export function useConfirmSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, eventMinistryId, confirmed }: {
      id: string; eventMinistryId: string; confirmed: boolean;
    }) => confirmScheduleAction(id, confirmed).then(() => eventMinistryId),
    onSuccess: (eventMinistryId) => {
      qc.invalidateQueries({ queryKey: ['event-schedules', eventMinistryId] });
    },
  });
}

export function useCheckInSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, eventMinistryId, checkedIn }: {
      id: string; eventMinistryId: string; checkedIn: boolean;
    }) => checkInScheduleAction(id, checkedIn).then(() => eventMinistryId),
    onSuccess: (eventMinistryId) => {
      qc.invalidateQueries({ queryKey: ['event-schedules', eventMinistryId] });
    },
  });
}

/** Todas as pessoas escaladas num evento, em todos os ministérios — para detetar conflitos de escala. */
export function useEventAssignments(eventId: string | null) {
  return useQuery({
    queryKey: ['event-assignments', eventId],
    enabled: !!eventId,
    queryFn: () => fetchEventAssignmentsAction(eventId!),
  });
}

export function useUpdateEventSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, functions }: { id: string; functions: string[] }) =>
      updateEventScheduleAction(id, functions),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['event-schedules'] });
    },
  });
}

export function useEventSetlist(eventId: string | null) {
  return useQuery({
    queryKey: ['event-setlist', eventId],
    enabled: !!eventId,
    queryFn: () => fetchEventSetlistAction(eventId!),
  });
}

export function useReorderEventSetlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, orderedSongIds }: { eventId: string; orderedSongIds: string[] }) =>
      reorderEventSetlistAction(eventId, orderedSongIds),
    onMutate: async ({ eventId, orderedSongIds }) => {
      const queryKey = ['event-setlist', eventId];
      await qc.cancelQueries({ queryKey });
      const previous = qc.getQueryData<(Song & { order_index: number })[]>(queryKey);
      if (previous) {
        const bySongId = new Map(previous.map((s) => [s.id, s]));
        const reordered = orderedSongIds
          .map((id, idx) => { const s = bySongId.get(id); return s ? { ...s, order_index: idx } : null; })
          .filter((s): s is Song & { order_index: number } => s !== null);
        qc.setQueryData(queryKey, reordered);
      }
      return { previous, eventId };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(['event-setlist', context.eventId], context.previous);
    },
    onSettled: (_data, _err, { eventId }) => {
      qc.invalidateQueries({ queryKey: ['event-setlist', eventId] });
    },
  });
}

export function useEventTimeline(eventId: string | null) {
  return useQuery({
    queryKey: ['event-timeline', eventId],
    enabled: !!eventId,
    queryFn: () => fetchEventTimelineAction(eventId!),
  });
}

export type { EventMinistry, EventSchedule, Ministry, Song };
