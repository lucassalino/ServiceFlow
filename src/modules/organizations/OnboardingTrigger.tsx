'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useOrgStore } from '@/stores/orgStore';
import { useMyParticipation } from '@/hooks/useParticipation';
import { MyParticipationDialog } from './MyParticipationDialog';

/**
 * Abre o onboarding "Completa o teu perfil" quando o utilizador entra numa
 * organização — via ?setup=1 (vindo do join) ou na primeira visita de um
 * membro/líder que ainda não definiu participações. Só mostra uma vez por org
 * e por sessão (guardado em sessionStorage).
 */
export function OnboardingTrigger({ orgId }: { orgId: string }) {
  const params = useSearchParams();
  const forced = params.get('setup') === '1';
  const { activeMembership } = useOrgStore();
  const role = activeMembership?.role;

  const [open, setOpen] = useState(false);
  const { data } = useMyParticipation(orgId, true);

  useEffect(() => {
    if (open) return;
    const key = `wis_onboarded_${orgId}`;
    const alreadyShown = typeof window !== 'undefined' && sessionStorage.getItem(key) === '1';

    if (forced) { setOpen(true); return; }

    // Auto: membros/líderes sem participações definidas, uma vez por sessão.
    if (!alreadyShown && data && role && role !== 'admin' && data.mine.length === 0) {
      setOpen(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forced, data, role, orgId]);

  function handleOpenChange(v: boolean) {
    setOpen(v);
    if (!v && typeof window !== 'undefined') {
      sessionStorage.setItem(`wis_onboarded_${orgId}`, '1');
    }
  }

  return <MyParticipationDialog orgId={orgId} open={open} onOpenChange={handleOpenChange} onboarding />;
}
