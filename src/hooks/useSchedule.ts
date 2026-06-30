'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { EventMinistry, EventSchedule, Ministry, Song } from '@/types/models';
import {
  fetchEventMinistriesAction,
  fetchEventSchedulesAction,
  fetchEventSetlistAction,
  addMinistryToEventAction,
  removeMinistryFromEventAction,
  addPersonToScheduleAction,
  removePersonFromScheduleAction,
  confirmScheduleAction,
  updateEventScheduleAction,
} from '@/actions/schedule';

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
      addMinistryToEventAction(eventId, ministryId),
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
    }) => addPersonToScheduleAction(eventMinistryId, userId, functions),
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

export type { EventMinistry, EventSchedule, Ministry, Song };
