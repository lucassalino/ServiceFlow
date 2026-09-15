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

function useInvalidateFamily(orgId: string) {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: keyFor(orgId) });
    qc.invalidateQueries({ queryKey: orgKeyFor(orgId) });
  };
}

export function useProposeFamilyRelationship(orgId: string) {
  const invalidate = useInvalidateFamily(orgId);
  return useMutation({
    mutationFn: ({ otherUserId, preference }: { otherUserId: string; preference: FamilyPreference }) =>
      proposeFamilyRelationshipAction(orgId, otherUserId, preference),
    onSuccess: invalidate,
  });
}

export function useRespondToFamilyRelationship(orgId: string) {
  const invalidate = useInvalidateFamily(orgId);
  return useMutation({
    mutationFn: ({ rowId, accept }: { rowId: string; accept: boolean }) => respondToFamilyRelationshipAction(rowId, accept),
    onSuccess: invalidate,
  });
}

export function useUpdateFamilyRelationship(orgId: string) {
  const invalidate = useInvalidateFamily(orgId);
  return useMutation({
    mutationFn: ({ rowId, preference }: { rowId: string; preference: FamilyPreference }) =>
      updateFamilyRelationshipAction(rowId, preference),
    onSuccess: invalidate,
  });
}

export function useRemoveFamilyRelationship(orgId: string) {
  const invalidate = useInvalidateFamily(orgId);
  return useMutation({
    mutationFn: (rowId: string) => removeFamilyRelationshipAction(rowId),
    onSuccess: invalidate,
  });
}

export type { FamilyPreference };
