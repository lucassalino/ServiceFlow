'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrgStore } from '@/stores/orgStore';
import type { Liturgy, LiturgyMoment } from '@/types/models';
import {
  fetchLiturgiesAction,
  createLiturgyAction,
  updateLiturgyAction,
  deleteLiturgyAction,
  type LiturgyPayload,
} from '@/actions/liturgies';

export function useLiturgies() {
  const { activeOrg } = useOrgStore();
  return useQuery({
    queryKey: ['liturgies', activeOrg?.id],
    enabled: !!activeOrg?.id,
    queryFn: () => fetchLiturgiesAction(activeOrg!.id),
  });
}

export function useCreateLiturgy() {
  const qc = useQueryClient();
  const { activeOrg } = useOrgStore();
  return useMutation({
    mutationFn: (payload: LiturgyPayload) => createLiturgyAction(activeOrg!.id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['liturgies', activeOrg?.id] }),
  });
}

export function useUpdateLiturgy() {
  const qc = useQueryClient();
  const { activeOrg } = useOrgStore();
  return useMutation({
    mutationFn: ({ id, ...payload }: LiturgyPayload & { id: string }) => updateLiturgyAction(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['liturgies', activeOrg?.id] }),
  });
}

export function useDeleteLiturgy() {
  const qc = useQueryClient();
  const { activeOrg } = useOrgStore();
  return useMutation({
    mutationFn: (id: string) => deleteLiturgyAction(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['liturgies', activeOrg?.id] }),
  });
}

export type { Liturgy, LiturgyMoment, LiturgyPayload };
