'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Sparkles, ArrowUpRight, Settings2, Loader2 } from 'lucide-react';
import { useOrgSubscription, useIsPlatformAdmin } from '@/hooks/useSubscription';
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
          color: accent ? '#8fd0ea' : 'rgba(255,255,255,0.55)',
        }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

interface Props { orgId: string; isAdmin: boolean }

export function PlanSection({ orgId, isAdmin }: Props) {
  const { data: sub, isLoading } = useOrgSubscription(orgId);
  const { data: isPlatformAdmin } = useIsPlatformAdmin();

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
      <Card title="O teu plano" icon={<Sparkles style={{ width: '1rem', height: '1rem', color: '#8fd0ea' }} />}>
        {isLoading ? (
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>A carregar…</p>
        ) : (
          <div style={{
            position: 'relative', overflow: 'hidden',
            borderRadius: '0.875rem',
            border: '1px solid rgba(143,208,234,0.3)',
            background: 'linear-gradient(135deg, rgba(44,127,168,0.16) 0%, rgba(20,83,111,0.06) 55%, rgba(22,22,26,0) 100%)',
            padding: '1.1rem 1.15rem',
          }}>
            {/* brilho decorativo */}
            <div style={{
              position: 'absolute', top: -40, right: -30, width: 160, height: 160,
              background: 'radial-gradient(circle, rgba(143,208,234,0.18) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />

            {/* Nome + fonte */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', position: 'relative' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>{current.label}</span>
              <span style={{
                fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
                padding: '0.18rem 0.55rem', borderRadius: '9999px',
                background: 'rgba(143,208,234,0.2)', color: '#c9ecf7', border: '1px solid rgba(143,208,234,0.35)',
              }}>{sourceLabel[sub?.source ?? 'free'] ?? sub?.source}</span>
            </div>

            {/* Preço (se pago) */}
            {current.priceMonthly > 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.55)', marginTop: '0.15rem' }}>
                {current.priceMonthly.toFixed(2).replace('.', ',')} € / mês
              </p>
            ) : (
              <p style={{ fontSize: '0.8rem', color: '#6ee7b7', marginTop: '0.15rem', fontWeight: 600 }}>Grátis</p>
            )}

            {/* Limites — anéis de utilização (verde / amarelo ≥80% / vermelho no limite) */}
            <PlanLimitRings />

            {sub?.expires_at && (
              <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.7rem' }}>
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
                color: '#fff', border: 'none', cursor: 'pointer',
                fontSize: '0.82rem', fontWeight: 800, letterSpacing: '0.01em',
                boxShadow: '0 4px 14px rgba(44,127,168,0.35)',
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
                  background: 'transparent', color: 'rgba(255,255,255,0.75)',
                  border: '1px solid rgba(255,255,255,0.15)', cursor: portalLoading ? 'not-allowed' : 'pointer',
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
      <CouponsSection orgId={orgId} isAdmin={isAdmin} isPlatformAdmin={!!isPlatformAdmin} />
    </div>
  );
}
