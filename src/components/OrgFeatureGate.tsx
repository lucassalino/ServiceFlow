'use client';

import { EyeOff } from 'lucide-react';
import { useOrgStore } from '@/stores/orgStore';
import { ORG_FEATURE_INFO, isOrgFeatureEnabled, type OrgToggleFeature } from '@/lib/org-features';

/** true se o administrador não desligou esta funcionalidade para a organização ativa. */
export function useOrgFeatureEnabled(feature: OrgToggleFeature): boolean {
  const { activeOrg } = useOrgStore();
  return isOrgFeatureEnabled(activeOrg?.disabled_features, feature);
}

interface Props {
  feature: OrgToggleFeature;
  children: React.ReactNode;
}

/**
 * Esconde uma página inteira quando o administrador desligou a funcionalidade
 * em Definições → Funcionalidades. Ao contrário do `FeatureGate` (plano), não
 * há "atualiza para desbloquear" — é uma escolha da organização, reversível
 * por quem administra.
 */
export function OrgFeatureGate({ feature, children }: Props) {
  const enabled = useOrgFeatureEnabled(feature);
  const { activeMembership } = useOrgStore();
  const isAdmin = activeMembership?.role === 'admin';

  if (enabled) return <>{children}</>;

  const info = ORG_FEATURE_INFO[feature];
  return (
    <div className="dash-purple-bg" style={{ minHeight: '100%' }}>
      <div className="p-5 md:p-8" style={{ maxWidth: '28rem', margin: '3rem auto 0', textAlign: 'center' }}>
        <div style={{
          width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem', margin: '0 auto 0.875rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--wis-surface-2)', border: '1px solid var(--wis-border-strong)',
        }}>
          <EyeOff style={{ width: '1.1rem', height: '1.1rem', color: 'var(--wis-text-3)' }} />
        </div>
        <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--wis-text)', margin: '0 0 0.3rem' }}>
          {info.label} está desativado
        </p>
        <p style={{ fontSize: '0.82rem', color: 'var(--wis-text-2)', margin: 0, lineHeight: 1.6 }}>
          {isAdmin
            ? 'O administrador desligou esta funcionalidade em Definições → Funcionalidades.'
            : 'O administrador desligou esta funcionalidade para a organização.'}
        </p>
      </div>
    </div>
  );
}
