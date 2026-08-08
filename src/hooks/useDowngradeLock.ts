'use client';
import { useQuery } from '@tanstack/react-query';
import { useOrgStore } from '@/stores/orgStore';
import { fetchDowngradeLockInfoAction } from '@/actions/downgrade';

/** Estado do bloqueio de downgrade da org ativa — para desativar a entrada em recursos não escolhidos. */
export function useDowngradeLock() {
  const { activeOrg } = useOrgStore();
  return useQuery({
    queryKey: ['downgrade-lock', activeOrg?.id],
    enabled: !!activeOrg?.id,
    queryFn: () => fetchDowngradeLockInfoAction(activeOrg!.id),
  });
}
