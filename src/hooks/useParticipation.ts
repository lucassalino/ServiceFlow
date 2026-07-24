'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchMyParticipationAction, saveMyParticipationAction } from '@/actions/participation';

export function useMyParticipation(orgId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['my-participation', orgId],
    enabled: !!orgId && enabled,
    queryFn: () => fetchMyParticipationAction(orgId!),
  });
}

export function useSaveMyParticipation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      orgId: string;
      phone: string | null;
      birthday: string | null;
      entries: { ministryId: string; functions: string[] }[];
    }) => saveMyParticipationAction(vars.orgId, { phone: vars.phone, birthday: vars.birthday, entries: vars.entries }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-participation'] });
      qc.invalidateQueries({ queryKey: ['profile'] });
      qc.invalidateQueries({ queryKey: ['members'] });
    },
  });
}
