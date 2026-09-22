'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchMyFamilyRelationshipsAction,
  fetchOrgFamiliesAction,
  proposeFamilyRelationshipAction,
  respondToFamilyRelationshipAction,
  updateFamilyRelationshipAction,
  removeFamilyRelationshipAction,
  type FamilyPreference,
  type FamilyRelationship,
} from '@/actions/families';

const keyFor = (orgId: string) => ['my-family-relationships', orgId] as const;
const orgKeyFor = (orgId: string | null | undefined) => ['org-families', orgId] as const;

export function useMyFamilyRelationships(orgId: string) {
  return useQuery({
    queryKey: keyFor(orgId),
    queryFn: () => fetchMyFamilyRelationshipsAction(orgId),
    enabled: !!orgId,
  });
}

/** Relações já confirmadas da organização — para sugerir/avisar ao montar a escala. */
export function useOrgFamilies(orgId: string | null | undefined) {
  return useQuery({
    queryKey: orgKeyFor(orgId),
    queryFn: () => fetchOrgFamiliesAction(orgId!),
    enabled: !!orgId,
  });
}

/**
 * Atualiza a lista localmente (sem esperar por um novo pedido ao servidor)
 * e só depois pede dados frescos em segundo plano — o resultado aparece na
 * hora em vez de ficar uns segundos com ar de que não gravou.
 */
function usePatchFamilyCache(orgId: string) {
  const qc = useQueryClient();
  return (patch: (list: FamilyRelationship[]) => FamilyRelationship[]) => {
    qc.setQueryData(keyFor(orgId), (prev: FamilyRelationship[] | undefined) => patch(prev ?? []));
    qc.invalidateQueries({ queryKey: keyFor(orgId) });
    qc.invalidateQueries({ queryKey: orgKeyFor(orgId) });
  };
}

export function useProposeFamilyRelationship(orgId: string) {
  const patch = usePatchFamilyCache(orgId);
  return useMutation({
    mutationFn: ({ otherUserId, preference }: { otherUserId: string; preference: FamilyPreference }) =>
      proposeFamilyRelationshipAction(orgId, otherUserId, preference),
    onSuccess: (created) => patch((list) => [...list, created]),
  });
}

export function useRespondToFamilyRelationship(orgId: string) {
  const patch = usePatchFamilyCache(orgId);
  return useMutation({
    mutationFn: ({ rowId, accept }: { rowId: string; accept: boolean }) => respondToFamilyRelationshipAction(rowId, accept),
    onSuccess: (_data, { rowId, accept }) => patch((list) => (
      accept
        ? list.map((r) => (r.rowId === rowId ? { ...r, status: 'accepted' as const } : r))
        : list.filter((r) => r.rowId !== rowId)
    )),
  });
}

export function useUpdateFamilyRelationship(orgId: string) {
  const patch = usePatchFamilyCache(orgId);
  return useMutation({
    mutationFn: ({ rowId, preference }: { rowId: string; preference: FamilyPreference }) =>
      updateFamilyRelationshipAction(rowId, preference),
    onSuccess: (_data, { rowId, preference }) => patch((list) => list.map((r) => (
      r.rowId === rowId ? { ...r, preference, status: 'pending' as const, isRequester: true } : r
    ))),
  });
}

export function useRemoveFamilyRelationship(orgId: string) {
  const patch = usePatchFamilyCache(orgId);
  return useMutation({
    mutationFn: (rowId: string) => removeFamilyRelationshipAction(rowId),
    onSuccess: (_data, rowId) => patch((list) => list.filter((r) => r.rowId !== rowId)),
  });
}

export type { FamilyPreference };
