'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrgStore } from '@/stores/orgStore';
import type { OrganizationMember, MinistryMember, OrgRole } from '@/types/models';
import {
  fetchOrgMembersAction,
  fetchMinistryMembersAction,
  updateMemberRoleAction,
  toggleMemberActiveAction,
} from '@/actions/members';

export function useOrgMembers() {
  const { activeOrg } = useOrgStore();
  return useQuery({
    queryKey: ['members', activeOrg?.id],
    enabled: !!activeOrg?.id,
    queryFn: () => fetchOrgMembersAction(activeOrg!.id),
  });
}

export function useMinistryMembers(ministryId: string | null) {
  return useQuery({
    queryKey: ['ministry-members', ministryId],
    enabled: !!ministryId,
    queryFn: () => fetchMinistryMembersAction(ministryId!),
  });
}

export function useUpdateMemberRole() {
  const qc = useQueryClient();
  const { activeOrg } = useOrgStore();
  return useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: OrgRole }) =>
      updateMemberRoleAction(memberId, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members', activeOrg?.id] }),
  });
}

export function useToggleMemberActive() {
  const qc = useQueryClient();
  const { activeOrg } = useOrgStore();
  return useMutation({
    mutationFn: ({ memberId, isActive }: { memberId: string; isActive: boolean }) =>
      toggleMemberActiveAction(memberId, isActive),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members', activeOrg?.id] }),
  });
}

export type { OrganizationMember, MinistryMember, OrgRole };
