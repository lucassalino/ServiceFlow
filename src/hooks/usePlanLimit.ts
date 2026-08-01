'use client';

import { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useOrgStore } from '@/stores/orgStore';
import { fetchPlanUsageAction } from '@/actions/subscriptions';
import { isPlanLimitError, type PlanLimitError } from '@/lib/plan-limits';

/**
 * Estado do modal de "limite atingido".
 *
 * Uso típico num componente:
 *   const planLimit = usePlanLimitDialog();
 *   ...
 *   createMinistry.mutate(payload, { onError: planLimit.handleError });
 *   ...
 *   <PlanLimitDialog {...planLimit.dialogProps} />
 */
export function usePlanLimitDialog() {
  const { activeMembership } = useOrgStore();
  const [error, setError] = useState<PlanLimitError | null>(null);

  /**
   * Trata o erro de uma mutation. Devolve true se era um limite de plano
   * (e abriu o modal), false se é outro erro — assim quem chama sabe se
   * ainda precisa de mostrar o seu próprio toast.
   */
  const handleError = useCallback((e: unknown): boolean => {
    if (isPlanLimitError(e)) {
      setError(e);
      return true;
    }
    return false;
  }, []);

  const close = useCallback(() => setError(null), []);

  return {
    handleError,
    close,
    dialogProps: {
      error,
      onClose: close,
      isAdmin: activeMembership?.role === 'admin',
    },
  };
}

/** Utilização dos três limites da organização ativa (alimenta o banner). */
export function usePlanUsage(enabled = true) {
  const { activeOrg } = useOrgStore();
  return useQuery({
    queryKey: ['plan-usage', activeOrg?.id],
    enabled: !!activeOrg?.id && enabled,
    queryFn: () => fetchPlanUsageAction(activeOrg!.id),
    staleTime: 60_000,
  });
}
