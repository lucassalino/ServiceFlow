'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Sparkles, ArrowUpRight, Settings2, Loader2 } from 'lucide-react';
import { useOrgSubscription } from '@/hooks/useSubscription';
import { getPlan } from '@/lib/plans';
import { PlansDialog } from './PlansDialog';
import { CouponsSection } from './CouponsSection';
import { createBillingPortalSessionAction } from '@/actions/stripe-checkout';
import { PlanLimitRings } from './PlanLimitRing';

// Sub-secção "plana" (sem moldura própria) para integrar no cartão Organização.
function Card({ title, icon, accent, children }: {
  title: string; icon?: React.ReactNode; accent?: boolean; children: React.ReactNode;
}) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
        {icon}
        <h3 style={{
          fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
          color: accent ? 'var(--wis-blue)' : 'var(--wis-text-2)',
        }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

interface Props { orgId: string; isAdmin: boolean }

export function PlanSection({ orgId, isAdmin }: Props) {
  const { data: sub, isLoading } = useOrgSubscription(orgId);

  const [plansOpen, setPlansOpen] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  async function handlePortal() {
    setPortalLoading(true);
    try {
      const result = await createBillingPortalSessionAction(orgId);
      if (result.ok) {
        window.location.href = result.url;
        return;
      }
      toast.error(result.message);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao abrir o portal de faturação');
    } finally {
      setPortalLoading(false);
    }
  }

  const current = getPlan(sub?.plan);

  const sourceLabel: Record<string, string> = {
    free: 'Grátis', manual: 'Concedido (dev)', coupon: 'Cupão', stripe: 'Pago',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Plano atual — painel destacado */}
      <Card title="O teu plano" icon={<Sparkles style={{ width: '1rem', height: '1rem', color: 'var(--wis-blue)' }} />}>
        {isLoading ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--wis-text-3)' }}>A carregar…</p>
        ) : (
          <div style={{
            position: 'relative', overflow: 'hidden',
            borderRadius: '0.875rem',
            border: '1px solid var(--wis-blue-border)',
            background: 'linear-gradient(135deg, var(--wis-blue-soft) 0%, rgba(20,83,111,0.06) 55%, var(--wis-surface) 100%)',
            padding: '1.1rem 1.15rem',
          }}>
            {/* brilho decorativo */}
            <div style={{
              position: 'absolute', top: -40, right: -30, width: 160, height: 160,
              background: 'radial-gradient(circle, var(--wis-blue-soft) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />

            {/* Nome + fonte */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', position: 'relative' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--wis-text)', letterSpacing: '-0.01em' }}>{current.label}</span>
              <span style={{
                fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
                padding: '0.18rem 0.55rem', borderRadius: '9999px',
                background: 'var(--wis-blue-soft)', color: '#c9ecf7', border: '1px solid var(--wis-blue-border)',
              }}>{sourceLabel[sub?.source ?? 'free'] ?? sub?.source}</span>
            </div>

            {/* Preço (se pago) */}
            {current.priceMonthly > 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--wis-text-2)', marginTop: '0.15rem' }}>
                {current.priceMonthly.toFixed(2).replace('.', ',')} € / mês
              </p>
            ) : (
              <p style={{ fontSize: '0.8rem', color: 'var(--wis-success)', marginTop: '0.15rem', fontWeight: 600 }}>Grátis</p>
            )}

            {/* Limites — anéis de utilização (verde / amarelo ≥80% / vermelho no limite) */}
            <PlanLimitRings />

            {sub?.expires_at && (
              <p style={{ fontSize: '0.72rem', color: 'var(--wis-text-3)', marginTop: '0.7rem' }}>
                Expira em {new Date(sub.expires_at).toLocaleDateString('pt-PT')}
              </p>
            )}

            {/* Botão upgrade */}
            <button
              onClick={() => setPlansOpen(true)}
              style={{
                width: '100%', marginTop: '1rem',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                padding: '0.6rem 1rem', borderRadius: '0.625rem',
                background: 'linear-gradient(135deg, #2c7fa8 0%, #14536f 100%)',
                color: 'var(--wis-text)', border: 'none', cursor: 'pointer',
                fontSize: '0.82rem', fontWeight: 800, letterSpacing: '0.01em',
                boxShadow: '0 4px 14px var(--wis-blue-soft)',
              }}
            >
              Ver planos e fazer upgrade
              <ArrowUpRight style={{ width: '0.9rem', height: '0.9rem' }} />
            </button>

            {sub?.has_stripe_customer && (
              <button
                onClick={handlePortal}
                disabled={portalLoading}
                style={{
                  width: '100%', marginTop: '0.5rem',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                  padding: '0.6rem 1rem', borderRadius: '0.625rem',
                  background: 'transparent', color: 'var(--wis-text)',
                  border: '1px solid var(--wis-border-strong)', cursor: portalLoading ? 'not-allowed' : 'pointer',
                  fontSize: '0.82rem', fontWeight: 700, opacity: portalLoading ? 0.6 : 1,
                }}
              >
                {portalLoading
                  ? <Loader2 style={{ width: '0.9rem', height: '0.9rem' }} className="animate-spin" />
                  : <Settings2 style={{ width: '0.9rem', height: '0.9rem' }} />}
                Gerir assinatura
              </button>
            )}
          </div>
        )}
      </Card>

      <PlansDialog open={plansOpen} onOpenChange={setPlansOpen} currentPlan={current.key} orgId={orgId} />

      {/* Cupões — resgate (admin da org) + gestão (super-admin) */}
      <CouponsSection orgId={orgId} isAdmin={isAdmin} />
    </div>
  );
}
