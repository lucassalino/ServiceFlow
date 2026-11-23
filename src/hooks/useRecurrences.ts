'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrgStore } from '@/stores/orgStore';
import {
  fetchRecurrencesAction,
  createRecurrenceAction,
  updateRecurrenceAction,
  toggleRecurrenceActiveAction,
  deleteRecurrenceAction,
  generateUpcomingRecurrenceEventsAction,
  type RecurrencePayload,
} from '@/actions/recurrences';

export type { RecurrencePayload };

function keyFor(orgId?: string) { return ['recurrences', orgId]; }

export function useRecurrences() {
  const { activeOrg } = useOrgStore();
  return useQuery({
    queryKey: keyFor(activeOrg?.id),
    enabled: !!activeOrg?.id,
    queryFn: () => fetchRecurrencesAction(activeOrg!.id),
  });
}

export function useCreateRecurrence() {
  const qc = useQueryClient();
  const { activeOrg } = useOrgStore();
  return useMutation({
    mutationFn: (payload: RecurrencePayload) => createRecurrenceAction(activeOrg!.id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: keyFor(activeOrg?.id) }),
  });
}

export function useUpdateRecurrence() {
  const qc = useQueryClient();
  const { activeOrg } = useOrgStore();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RecurrencePayload }) =>
      updateRecurrenceAction(id, activeOrg!.id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: keyFor(activeOrg?.id) }),
  });
}

export function useToggleRecurrenceActive() {
  const qc = useQueryClient();
  const { activeOrg } = useOrgStore();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      toggleRecurrenceActiveAction(id, activeOrg!.id, active),
    onSuccess: () => qc.invalidateQueries({ queryKey: keyFor(activeOrg?.id) }),
  });
}

export function useDeleteRecurrence() {
  const qc = useQueryClient();
  const { activeOrg } = useOrgStore();
  return useMutation({
    mutationFn: (id: string) => deleteRecurrenceAction(id, activeOrg!.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: keyFor(activeOrg?.id) }),
  });
}

/** Gera os eventos em falta das recorrências ativas — chamado ao abrir a tela de Eventos. */
export function useGenerateRecurrenceEvents() {
  const qc = useQueryClient();
  const { activeOrg } = useOrgStore();
  return useMutation({
    mutationFn: () => generateUpcomingRecurrenceEventsAction(activeOrg!.id),
    onSuccess: (created) => {
      if (created.length > 0) qc.invalidateQueries({ queryKey: ['events', activeOrg?.id] });
    },
  });
}
