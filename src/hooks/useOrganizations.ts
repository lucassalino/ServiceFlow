'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Organization, OrganizationMember } from '@/types/models';
import {
  fetchOrgMembershipsAction,
  leaveOrganizationAction,
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

export type { Organization, OrganizationMember };
