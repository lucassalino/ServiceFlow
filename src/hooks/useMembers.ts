'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrgStore } from '@/stores/orgStore';
import type { OrganizationMember, MinistryMember, OrgRole } from '@/types/models';
import {
  fetchOrgMembersAction,
  fetchMinistryMembersAction,
  fetchMemberMinistriesAction,
  updateMemberRoleAction,
  toggleMemberActiveAction,
  deleteMemberAction,
  upsertMemberMinistriesAction,
} from '@/actions/members';
import { PlanLimitError, PLAN_LIMIT_CODE, type PlanGuarded } from '@/lib/plan-limits';
import { unwrapLockGuarded, DowngradeLockError, DOWNGRADE_LOCK_CODE, type LockGuarded } from '@/lib/downgrade-lock';

function unwrapRoleResult(result: PlanGuarded<void> | LockGuarded<void>): void {
  if (result.ok) return;
  if (result.code === PLAN_LIMIT_CODE) {
    throw new PlanLimitError({
      resource: result.resource, used: result.used, limit: result.limit, planName: result.planName,
    });
  }
  if (result.code === DOWNGRADE_LOCK_CODE) throw new DowngradeLockError(result.message);
}

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
      updateMemberRoleAction(memberId, role).then(unwrapRoleResult),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members', activeOrg?.id] }),
  });
}

export function useMemberMinistries(userId: string | null) {
  return useQuery({
    queryKey: ['member-ministries', userId],
    enabled: !!userId,
    queryFn: () => fetchMemberMinistriesAction(userId!),
  });
}

export function useUpsertMemberMinistries() {
  const qc = useQueryClient();
  const { activeOrg } = useOrgStore();
  return useMutation({
    mutationFn: ({ userId, assignments }: {
      userId: string;
      assignments: { ministryId: string; functions: string[] }[];
    }) => upsertMemberMinistriesAction(userId, activeOrg!.id, assignments).then(unwrapLockGuarded),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['member-ministries', vars.userId] });
      qc.invalidateQueries({ queryKey: ['ministry-members'] });
    },
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

export function useDeleteMember() {
  const qc = useQueryClient();
  const { activeOrg } = useOrgStore();
  return useMutation({
    mutationFn: (memberId: string) => deleteMemberAction(memberId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members', activeOrg?.id] }),
  });
}

export type { OrganizationMember, MinistryMember, OrgRole };
