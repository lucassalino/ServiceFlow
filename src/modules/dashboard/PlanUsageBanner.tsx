'use client';

import { useState } from 'react';
import { TrendingUp, X, ExternalLink } from 'lucide-react';
import { useOrgStore } from '@/stores/orgStore';
import { usePlanUsage } from '@/hooks/usePlanLimit';
import { usePlanState, PlanBadge } from '@/components/FeatureGate';
import {
  isNearLimit, isAtLimit, usagePercent, RESOURCE_LABEL,
  type PlanResource, type PlanLimitState,
} from '@/lib/plan-limits';

const PLANS_URL = 'https://wis-services.com/planos';

/**
 * Aviso discreto quando a organização está a ≥80% de algum limite do plano.
 * Só aparece a admins e líderes (quem pode agir) e pode ser dispensado.
 */
export function PlanUsageBanner() {
  const { activeOrg, activeMembership } = useOrgStore();
  const role = activeMembership?.role;
  const canAct = role === 'admin' || role === 'leader';

  const dismissKey = `wis_plan_banner_${activeOrg?.id ?? ''}`;
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(dismissKey) === '1';
  });

  const { data } = usePlanUsage(canAct && !dismissed);
  const { data: plan } = usePlanState();

  // Cortesia: mostramos o selo mesmo quando não há aviso de limite, para o
  // admin perceber que tem plano pago sem pagar (e não achar que é um bug).
  if (canAct && plan?.courtesy && !dismissed) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.625rem',
        padding: '0.7rem 1rem', borderRadius: '0.75rem',
        background: 'rgba(110,231,183,0.06)', border: '1px solid rgba(110,231,183,0.18)',
      }}>
        <PlanBadge state={plan} />
        <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.55)', margin: 0, flex: 1 }}>
          Tens o plano <strong style={{ color: '#fff' }}>{plan.name}</strong> ativo como cortesia — sem qualquer custo.
        </p>
        <button onClick={dismiss} aria-label="Dispensar" style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem',
          color: 'rgba(255,255,255,0.3)', display: 'flex',
        }}>
          <X style={{ width: '0.85rem', height: '0.85rem' }} />
        </button>
      </div>
    );
  }

  if (!canAct || dismissed || !data) return null;

  // Recurso mais crítico: primeiro os que já atingiram o limite, depois os
  // que estão perto. Mostramos só um aviso, para não poluir o dashboard.
  // Admin fica de fora: é sempre 1 em qualquer plano, nunca é um limite que
  // um upgrade resolve, por isso avisar sobre ele não é acionável.
  const entries = (Object.entries(data) as [PlanResource, PlanLimitState][])
    .filter(([resource]) => resource !== 'admin');
  const critical =
    entries.find(([, s]) => isAtLimit(s)) ?? entries.find(([, s]) => isNearLimit(s));
  if (!critical) return null;

  const [resource, state] = critical;
  const label = RESOURCE_LABEL[resource];
  const pct = usagePercent(state);
  const atLimit = isAtLimit(state);

  const accent = atLimit ? '#f87171' : '#fcd34d';
  const tint = atLimit ? 'rgba(248,113,113,' : 'rgba(252,211,77,';

  function dismiss() {
    sessionStorage.setItem(dismissKey, '1');
    setDismissed(true);
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.875rem',
      padding: '0.75rem 1rem', borderRadius: '0.75rem',
      background: `${tint}0.07)`, border: `1px solid ${tint}0.2)`,
    }}>
      <TrendingUp style={{ width: '1rem', height: '1rem', color: accent, flexShrink: 0 }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '0.82rem', color: '#fff', fontWeight: 600, margin: 0 }}>
          {atLimit
            ? `Atingiste o limite de ${label.many} do plano ${state.planName}`
            : `Estás a usar ${pct}% do limite de ${label.many}`}
        </p>
        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', margin: '0.1rem 0 0' }}>
          {state.used} de {state.limit} {label.many} · plano {state.planName}
        </p>
      </div>

      {role === 'admin' && (
        <a
          href={PLANS_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0,
            fontSize: '0.78rem', fontWeight: 600, color: accent, textDecoration: 'none',
            padding: '0.35rem 0.7rem', borderRadius: '0.5rem',
            background: `${tint}0.12)`, border: `1px solid ${tint}0.25)`,
          }}
        >
          Ver planos
          <ExternalLink style={{ width: '0.7rem', height: '0.7rem' }} />
        </a>
      )}

      <button
        onClick={dismiss}
        aria-label="Dispensar aviso"
        style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem',
          color: 'rgba(255,255,255,0.35)', flexShrink: 0, display: 'flex',
        }}
      >
        <X style={{ width: '0.85rem', height: '0.85rem' }} />
      </button>
    </div>
  );
}
