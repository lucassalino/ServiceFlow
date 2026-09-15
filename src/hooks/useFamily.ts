'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchMyFamilyAction,
  createFamilyAction,
  addFamilyMemberAction,
  respondToFamilyInviteAction,
  removeFamilyMemberAction,
  updateFamilyPreferenceAction,
  disbandFamilyAction,
  type FamilyPreference,
} from '@/actions/families';

const keyFor = (orgId: string) => ['my-family', orgId] as const;

export function useMyFamily(orgId: string) {
  return useQuery({
    queryKey: keyFor(orgId),
    queryFn: () => fetchMyFamilyAction(orgId),
    enabled: !!orgId,
  });
}

function useInvalidateFamily(orgId: string) {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: keyFor(orgId) });
}

export function useCreateFamily(orgId: string) {
  const invalidate = useInvalidateFamily(orgId);
  return useMutation({
    mutationFn: ({ preference, memberUserIds }: { preference: FamilyPreference; memberUserIds: string[] }) =>
      createFamilyAction(orgId, preference, memberUserIds),
    onSuccess: invalidate,
  });
}

export function useAddFamilyMember(orgId: string) {
  const invalidate = useInvalidateFamily(orgId);
  return useMutation({
    mutationFn: ({ familyId, userId }: { familyId: string; userId: string }) =>
      addFamilyMemberAction(familyId, orgId, userId),
    onSuccess: invalidate,
  });
}

export function useRespondToFamilyInvite(orgId: string) {
  const invalidate = useInvalidateFamily(orgId);
  return useMutation({
    mutationFn: ({ rowId, accept }: { rowId: string; accept: boolean }) => respondToFamilyInviteAction(rowId, accept),
    onSuccess: invalidate,
  });
}

export function useRemoveFamilyMember(orgId: string) {
  const invalidate = useInvalidateFamily(orgId);
  return useMutation({
    mutationFn: (rowId: string) => removeFamilyMemberAction(rowId),
    onSuccess: invalidate,
  });
}

export function useUpdateFamilyPreference(orgId: string) {
  const invalidate = useInvalidateFamily(orgId);
  return useMutation({
    mutationFn: ({ familyId, preference }: { familyId: string; preference: FamilyPreference }) =>
      updateFamilyPreferenceAction(familyId, preference),
    onSuccess: invalidate,
  });
}

export function useDisbandFamily(orgId: string) {
  const invalidate = useInvalidateFamily(orgId);
  return useMutation({
    mutationFn: (familyId: string) => disbandFamilyAction(familyId),
    onSuccess: invalidate,
  });
}

export type { FamilyPreference };
