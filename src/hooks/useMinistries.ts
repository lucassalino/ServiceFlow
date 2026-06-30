'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrgStore } from '@/stores/orgStore';
import type { Ministry } from '@/types/models';
import {
  fetchMinistriesAction,
  createMinistryAction,
  updateMinistryAction,
  deleteMinistryAction,
  toggleMinistryActiveAction,
  importPresetMinistriesAction,
} from '@/actions/ministries';

export function useMinistries() {
  const { activeOrg } = useOrgStore();
  return useQuery({
    queryKey: ['ministries', activeOrg?.id],
    enabled: !!activeOrg?.id,
    queryFn: () => fetchMinistriesAction(activeOrg!.id),
  });
}

export interface MinistryPayload { name: string; icon: string; color: string; functions?: string[] }

export function useCreateMinistry() {
  const qc = useQueryClient();
  const { activeOrg } = useOrgStore();
  return useMutation({
    mutationFn: (payload: MinistryPayload) =>
      createMinistryAction(activeOrg!.id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ministries', activeOrg?.id] }),
  });
}

export function useUpdateMinistry() {
  const qc = useQueryClient();
  const { activeOrg } = useOrgStore();
  return useMutation({
    mutationFn: ({ id, ...payload }: MinistryPayload & { id: string }) =>
      updateMinistryAction(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ministries', activeOrg?.id] }),
  });
}

export function useToggleMinistryActive() {
  const qc = useQueryClient();
  const { activeOrg } = useOrgStore();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      toggleMinistryActiveAction(id, isActive),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ministries', activeOrg?.id] }),
  });
}

export function useImportPresetMinistries() {
  const qc = useQueryClient();
  const { activeOrg } = useOrgStore();
  return useMutation({
    mutationFn: () => importPresetMinistriesAction(activeOrg!.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ministries', activeOrg?.id] }),
  });
}

export function useDeleteMinistry() {
  const qc = useQueryClient();
  const { activeOrg } = useOrgStore();
  return useMutation({
    mutationFn: (id: string) => deleteMinistryAction(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ministries', activeOrg?.id] }),
  });
}

export type { Ministry };
