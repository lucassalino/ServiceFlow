'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrgStore } from '@/stores/orgStore';
import {
  fetchUnavailabilityAction,
  fetchOrgUnavailabilityAction,
  addUnavailabilityAction,
  removeUnavailabilityAction,
  type AddUnavailabilityInput,
  type UnavailabilityEntry,
} from '@/actions/availability';

export function useMyUnavailability() {
  const { activeOrg, activeMembership } = useOrgStore();
  const userId = activeMembership?.user_id;
  return useQuery({
    queryKey: ['unavailability', activeOrg?.id, userId],
    enabled: !!activeOrg?.id && !!userId,
    queryFn: () => fetchUnavailabilityAction(userId!, activeOrg!.id),
  });
}

/** Indisponibilidades de toda a organização — usado para avisar ao escalar pessoas. */
export function useOrgUnavailability() {
  const { activeOrg } = useOrgStore();
  return useQuery({
    queryKey: ['org-unavailability', activeOrg?.id],
    enabled: !!activeOrg?.id,
    queryFn: () => fetchOrgUnavailabilityAction(activeOrg!.id),
  });
}

export function useAddUnavailability() {
  const qc = useQueryClient();
  const { activeOrg, activeMembership } = useOrgStore();
  return useMutation({
    mutationFn: (entry: AddUnavailabilityInput) => addUnavailabilityAction(activeOrg!.id, entry),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['unavailability', activeOrg?.id, activeMembership?.user_id] });
      qc.invalidateQueries({ queryKey: ['org-unavailability', activeOrg?.id] });
    },
  });
}

export function useRemoveUnavailability() {
  const qc = useQueryClient();
  const { activeOrg, activeMembership } = useOrgStore();
  return useMutation({
    mutationFn: (id: string) => removeUnavailabilityAction(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['unavailability', activeOrg?.id, activeMembership?.user_id] });
      qc.invalidateQueries({ queryKey: ['org-unavailability', activeOrg?.id] });
    },
  });
}

export type { UnavailabilityEntry, AddUnavailabilityInput };
