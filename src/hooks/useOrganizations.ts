'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Organization, OrganizationMember } from '@/types/models';
import {
  fetchOrgMembershipsAction,
  leaveOrganizationAction,
  deleteOrganizationAction,
  transferOrgAdminAction,
} from '@/actions/organizations';

export function useOrgMemberships() {
  return useQuery({
    queryKey: ['org-memberships'],
    queryFn: () => fetchOrgMembershipsAction(),
  });
}

export function useLeaveOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orgId: string) => leaveOrganizationAction(orgId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['org-memberships'] }),
  });
}

export function useDeleteOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orgId: string) => deleteOrganizationAction(orgId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['org-memberships'] }),
  });
}

export function useTransferOrgAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, newAdminUserId }: { orgId: string; newAdminUserId: string }) =>
      transferOrgAdminAction(orgId, newAdminUserId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['org-memberships'] }),
  });
}

export type { Organization, OrganizationMember };
