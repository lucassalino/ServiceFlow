'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrgStore } from '@/stores/orgStore';
import type { Event } from '@/types/models';
import {
  fetchEventsAction,
  createEventAction,
  updateEventAction,
  deleteEventAction,
  publishEventAction,
  type EventPayload,
} from '@/actions/events';

export type { EventPayload };

export function useEvents() {
  const { activeOrg } = useOrgStore();
  return useQuery({
    queryKey: ['events', activeOrg?.id],
    enabled: !!activeOrg?.id,
    queryFn: () => fetchEventsAction(activeOrg!.id),
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  const { activeOrg } = useOrgStore();
  return useMutation({
    mutationFn: (payload: EventPayload) =>
      createEventAction(activeOrg!.id, payload),
    onSuccess: (created) => {
      // Mostra o evento na lista já nesta renderização — sem isto, quem cria
      // um evento tinha de sair da tela de Eventos e voltar para o ver.
      qc.setQueryData(['events', activeOrg?.id], (prev: Event[] | undefined) =>
        prev ? [...prev, created] : [created]);
      qc.invalidateQueries({ queryKey: ['events', activeOrg?.id] });
    },
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  const { activeOrg } = useOrgStore();
  return useMutation({
    mutationFn: ({ id, ...payload }: EventPayload & { id: string }) =>
      updateEventAction(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events', activeOrg?.id] }),
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  const { activeOrg } = useOrgStore();
  return useMutation({
    mutationFn: (id: string) => deleteEventAction(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events', activeOrg?.id] }),
  });
}

export function usePublishEvent() {
  const qc = useQueryClient();
  const { activeOrg } = useOrgStore();
  return useMutation({
    mutationFn: ({ id, publish }: { id: string; publish: boolean }) =>
      publishEventAction(id, publish),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events', activeOrg?.id] }),
  });
}

export type { Event };
