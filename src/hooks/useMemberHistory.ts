'use client';

import { useQuery } from '@tanstack/react-query';
import { useOrgStore } from '@/stores/orgStore';
import { useAuthStore } from '@/stores/authStore';
import { fetchMemberHistoryAction } from '@/actions/member-history';

/** Histórico de participações de uma pessoa na organização ativa. */
export function useMemberHistory(userId: string | undefined, enabled = true) {
  const { activeOrg } = useOrgStore();
  return useQuery({
    queryKey: ['member-history', activeOrg?.id, userId],
    enabled: !!activeOrg?.id && !!userId && enabled,
    queryFn: () => fetchMemberHistoryAction(activeOrg!.id, userId!),
    staleTime: 60_000,
  });
}

/** Atalho para o histórico do próprio utilizador ("As minhas escalas"). */
export function useMyHistory(enabled = true) {
  const { user } = useAuthStore();
  return useMemberHistory(user?.id, enabled);
}
