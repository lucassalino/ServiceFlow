'use client';

import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useOrgStore } from '@/stores/orgStore';
import { ORG_TOGGLE_FEATURES, ORG_FEATURE_INFO, isOrgFeatureEnabled } from '@/lib/org-features';

/**
 * Liga/desliga funcionalidades da app para esta organização. Independente
 * do plano — é uma preferência do administrador, não um limite de venda.
 * Guarda direto em `organizations.disabled_features`, tal como o nome da
 * organização faz um pouco acima nesta mesma página (RLS já garante que só
 * o admin escreve).
 */
export function FeatureVisibilitySection({ orgId }: { orgId: string }) {
  const { activeOrg, activeMembership, setActiveOrg } = useOrgStore();
  const disabled = activeOrg?.disabled_features ?? [];

  async function toggle(feature: string, nextEnabled: boolean) {
    if (!activeOrg || !activeMembership) return;
    const nextDisabled = nextEnabled
      ? disabled.filter((f) => f !== feature)
      : [...disabled, feature];

    // Otimista: a UI reflete a escolha de imediato.
    setActiveOrg({ ...activeOrg, disabled_features: nextDisabled }, activeMembership);

    const supabase = createClient();
    // `disabled_features` é da migração 041, ainda não presente nos tipos
    // gerados do Supabase — cast local, ver AGENTS.md.
    const { error } = await supabase.from('organizations').update({
      disabled_features: nextDisabled,
      updated_at: new Date().toISOString(),
    } as never).eq('id', orgId);

    if (error) {
      // Reverte se falhar.
      setActiveOrg({ ...activeOrg, disabled_features: disabled }, activeMembership);
      toast.error(error.message);
      return;
    }
    toast.success(
      nextEnabled ? `${ORG_FEATURE_INFO[feature as keyof typeof ORG_FEATURE_INFO].label} ativado` : `${ORG_FEATURE_INFO[feature as keyof typeof ORG_FEATURE_INFO].label} desativado`,
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {ORG_TOGGLE_FEATURES.map((feature) => {
        const enabled = isOrgFeatureEnabled(disabled, feature);
        const info = ORG_FEATURE_INFO[feature];
        return (
          <div
            key={feature}
            style={{
              display: 'flex', alignItems: 'center', gap: '1rem',
              padding: '0.75rem 1rem', borderRadius: '0.75rem',
              background: 'var(--wis-surface-2)', border: '1px solid var(--wis-border)',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--wis-text)', margin: 0 }}>
                {info.label}
              </p>
              <p style={{ fontSize: '0.78rem', color: 'var(--wis-text-3)', margin: '0.15rem 0 0', lineHeight: 1.5 }}>
                {info.description}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              aria-label={`${enabled ? 'Desativar' : 'Ativar'} ${info.label}`}
              onClick={() => toggle(feature, !enabled)}
              style={{
                flexShrink: 0, position: 'relative', width: '2.5rem', height: '1.4rem',
                borderRadius: '9999px', cursor: 'pointer', border: 'none', padding: 0,
                background: enabled ? 'var(--wis-blue)' : 'var(--wis-surface-4)',
                transition: 'background 0.15s',
              }}
            >
              <span
                style={{
                  position: 'absolute', top: '0.15rem', left: enabled ? '1.25rem' : '0.15rem',
                  width: '1.1rem', height: '1.1rem', borderRadius: '50%',
                  background: '#fff', transition: 'left 0.15s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }}
              />
            </button>
          </div>
        );
      })}
    </div>
  );
}
