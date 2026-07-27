'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchOrgSubscriptionAction,
  fetchIsPlatformAdminAction,
  grantPlanAction,
} from '@/actions/subscriptions';
import type { PlanKey } from '@/lib/plans';

export function useOrgSubscription(orgId: string | undefined) {
  return useQuery({
    queryKey: ['org-subscription', orgId],
    enabled: !!orgId,
    queryFn: () => fetchOrgSubscriptionAction(orgId!),
  });
}

export function useIsPlatformAdmin() {
  return useQuery({
    queryKey: ['is-platform-admin'],
    queryFn: () => fetchIsPlatformAdminAction(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useGrantPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { orgId: string; plan: PlanKey; note?: string; expiresAt?: string | null }) =>
      grantPlanAction(vars.orgId, vars.plan, { note: vars.note, expiresAt: vars.expiresAt }),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['org-subscription', vars.orgId] });
    },
  });
}
