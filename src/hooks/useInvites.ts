'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchPendingInvitesAction,
  createInviteAction,
  deleteInviteAction,
  type PendingInvite,
} from '@/actions/invites';
import type { OrgRole } from '@/types/models';

export function usePendingInvites(orgId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['invites', orgId],
    enabled: !!orgId && enabled,
    queryFn: () => fetchPendingInvitesAction(orgId!),
  });
}

export function useCreateInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, name, email, role }: { orgId: string; name: string; email: string; role?: OrgRole }) =>
      createInviteAction(orgId, name, email, role),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ['invites', vars.orgId] }),
  });
}

export function useDeleteInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, inviteId }: { orgId: string; inviteId: string }) =>
      deleteInviteAction(orgId, inviteId),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ['invites', vars.orgId] }),
  });
}

export type { PendingInvite };
