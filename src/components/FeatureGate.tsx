'use client';

import { useQuery } from '@tanstack/react-query';
import { Lock, ArrowUpCircle, ExternalLink, Sparkles } from 'lucide-react';
import { useOrgStore } from '@/stores/orgStore';
import { fetchPlanStateAction } from '@/actions/subscriptions';
import { FEATURE_INFO, hasFeature, type PlanFeature, type PlanState } from '@/lib/plan-features';

const PLANS_URL = 'https://wis-services.com/planos';

/** Estado do plano da organização ativa. */
export function usePlanState() {
  const { activeOrg } = useOrgStore();
  return useQuery({
    queryKey: ['plan-state', activeOrg?.id],
    enabled: !!activeOrg?.id,
    queryFn: () => fetchPlanStateAction(activeOrg!.id),
    staleTime: 5 * 60_000,
  });
}

/** true se a organização ativa tem acesso a esta funcionalidade. */
export function useHasFeature(feature: PlanFeature): { allowed: boolean; isLoading: boolean; plan?: PlanState } {
  const { data, isLoading } = usePlanState();
  return { allowed: hasFeature(data, feature), isLoading, plan: data };
}

interface Props {
  feature: PlanFeature;
  children: React.ReactNode;
  /** Se true, esconde por completo em vez de mostrar o cartão de bloqueio. */
  hideWhenLocked?: boolean;
}

/**
 * Mostra `children` se o plano incluir a funcionalidade; caso contrário,
 * um cartão que explica o que está em falta.
 *
 * Enquanto carrega mostra os filhos — evita o "salto" de conteúdo bloqueado
 * a aparecer e desaparecer, que dá a sensação de a app estar partida.
 */
export function FeatureGate({ feature, children, hideWhenLocked }: Props) {
  const { allowed, isLoading, plan } = useHasFeature(feature);

  if (isLoading || allowed) return <>{children}</>;
  if (hideWhenLocked) return null;

  return <FeatureLockedCard feature={feature} planName={plan?.name} />;
}

export function FeatureLockedCard({ feature, planName }: { feature: PlanFeature; planName?: string }) {
  const { activeMembership } = useOrgStore();
  const isAdmin = activeMembership?.role === 'admin';
  const info = FEATURE_INFO[feature];

  return (
    <div style={{
      padding: '1.5rem', borderRadius: '0.875rem', textAlign: 'center',
      background: 'var(--wis-surface-2)', border: '1px dashed var(--wis-border-strong)',
    }}>
      <div style={{
        width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem', margin: '0 auto 0.875rem',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--wis-warning-bg)', border: '1px solid #f3ddb6',
      }}>
        <Lock style={{ width: '1.1rem', height: '1.1rem', color: 'var(--wis-warning)' }} />
      </div>

      <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--wis-text)', margin: '0 0 0.3rem' }}>
        {info.label}
      </p>
      <p style={{ fontSize: '0.82rem', color: 'var(--wis-text-2)', margin: '0 0 1rem', lineHeight: 1.6 }}>
        {info.description}
        {planName && (
          <>
            <br />
            <span style={{ fontSize: '0.75rem', color: 'var(--wis-text-3)' }}>
              Não está incluído no plano {planName}.
            </span>
          </>
        )}
      </p>

      {isAdmin ? (
        <a
          href={PLANS_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.5rem 1rem', borderRadius: '0.5rem', textDecoration: 'none',
            fontSize: '0.82rem', fontWeight: 600,
            background: 'var(--wis-blue-soft)', border: '1px solid var(--wis-blue-border)',
            color: 'var(--wis-blue)',
          }}
        >
          <ArrowUpCircle style={{ width: '0.9rem', height: '0.9rem' }} />
          Ver planos
          <ExternalLink style={{ width: '0.7rem', height: '0.7rem', opacity: 0.6 }} />
        </a>
      ) : (
        <p style={{ fontSize: '0.78rem', color: 'var(--wis-text-3)', margin: 0 }}>
          Fala com o administrador da tua organização.
        </p>
      )}
    </div>
  );
}

/** Selo de plano — distingue uma cortesia de uma subscrição paga. */
export function PlanBadge({ state }: { state: PlanState }) {
  if (state.courtesy) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
        fontSize: '0.68rem', fontWeight: 700, padding: '0.15rem 0.5rem',
        borderRadius: '9999px', letterSpacing: '0.03em',
        background: 'var(--wis-success-bg)', border: '1px solid #bfe6d3',
        color: 'var(--wis-success)',
      }}>
        <Sparkles style={{ width: '0.7rem', height: '0.7rem' }} />
        Cortesia
      </span>
    );
  }
  return (
    <span style={{
      fontSize: '0.68rem', fontWeight: 700, padding: '0.15rem 0.5rem',
      borderRadius: '9999px', background: 'var(--wis-surface-3)',
      border: '1px solid var(--wis-border-strong)', color: 'var(--wis-text-2)',
    }}>
      {state.name}
    </span>
  );
}
