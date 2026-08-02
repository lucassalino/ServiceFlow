'use client';

import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PLAN_LIST, type PlanKey } from '@/lib/plans';
import { createCheckoutSessionAction } from '@/actions/stripe-checkout';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  currentPlan: PlanKey;
  orgId: string;
}

function fmtPrice(pt: number): string {
  if (pt === 0) return 'Grátis';
  return `${pt.toFixed(2).replace('.', ',')} €`;
}

function fmtLimit(n: number | null, singular: string, plural: string): string {
  if (n === null) return `${plural} ilimitados`;
  return `Até ${n} ${n === 1 ? singular : plural}`;
}

export function PlansDialog({ open, onOpenChange, currentPlan, orgId }: Props) {
  const [annual, setAnnual] = useState(false);
  const [loadingKey, setLoadingKey] = useState<PlanKey | null>(null);

  async function handleAssinar(plan: PlanKey) {
    setLoadingKey(plan);
    try {
      const result = await createCheckoutSessionAction(orgId, plan, annual ? 'annual' : 'monthly');
      if (result.ok) {
        window.location.href = result.url;
        return;
      }
      toast.error(result.message);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao iniciar o checkout');
    } finally {
      setLoadingKey(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Planos</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground -mt-1 mb-2">
          Escolhe o plano que melhor serve a tua igreja. Cada plano inclui tudo o que vem no anterior.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
          <div style={{
            display: 'inline-flex', borderRadius: '9999px', padding: '0.2rem',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
          }}>
            {[false, true].map((v) => (
              <button
                key={String(v)}
                onClick={() => setAnnual(v)}
                style={{
                  padding: '0.3rem 0.8rem', borderRadius: '9999px', border: 'none', cursor: 'pointer',
                  fontSize: '0.72rem', fontWeight: 700,
                  background: annual === v ? '#fff' : 'transparent',
                  color: annual === v ? '#000' : 'rgba(255,255,255,0.55)',
                }}
              >
                {v ? 'Anual' : 'Mensal'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {PLAN_LIST.map((plan) => {
            const isCurrent = plan.key === currentPlan;
            const price = annual ? plan.priceAnnual : plan.priceMonthly;
            return (
              <div
                key={plan.key}
                style={{
                  position: 'relative',
                  display: 'flex', flexDirection: 'column', gap: '0.75rem',
                  borderRadius: '0.875rem', padding: '1.1rem',
                  background: isCurrent ? 'rgba(165,180,252,0.08)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isCurrent ? 'rgba(165,180,252,0.4)' : 'rgba(255,255,255,0.09)'}`,
                }}
              >
                {isCurrent && (
                  <span style={{
                    position: 'absolute', top: '0.9rem', right: '0.9rem',
                    fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.05em',
                    textTransform: 'uppercase', padding: '0.15rem 0.5rem', borderRadius: '9999px',
                    background: 'rgba(165,180,252,0.2)', color: '#a5b4fc',
                    border: '1px solid rgba(165,180,252,0.35)',
                  }}>
                    Plano atual
                  </span>
                )}

                {/* Nome + preço */}
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>{plan.label}</h3>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', marginTop: '0.15rem' }}>
                    <span style={{ fontSize: '1.35rem', fontWeight: 800, color: price === 0 ? '#6ee7b7' : '#fff' }}>
                      {fmtPrice(price)}
                    </span>
                    {price > 0 && (
                      <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>/ {annual ? 'ano' : 'mês'}</span>
                    )}
                  </div>
                </div>

                {/* Limites */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {[
                    fmtLimit(plan.maxPeople, 'pessoa', 'pessoas'),
                    fmtLimit(plan.maxMinistries, 'ministério', 'ministérios'),
                    '1 admin',
                    plan.maxLeaders === null ? 'Líderes ilimitados' : plan.maxLeaders === 0 ? null : `${plan.maxLeaders} líder${plan.maxLeaders === 1 ? '' : 'es'}`,
                  ].filter((t): t is string => !!t).map((t) => (
                    <span key={t} style={{
                      fontSize: '0.68rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '9999px',
                      background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.55)',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}>
                      {t}
                    </span>
                  ))}
                </div>

                {/* Diferenciais */}
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.45rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.72)' }}>
                      <Check style={{ width: '0.85rem', height: '0.85rem', color: '#6ee7b7', flexShrink: 0, marginTop: '0.15rem' }} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div style={{ marginTop: 'auto', paddingTop: '0.4rem' }}>
                  {isCurrent ? (
                    <button disabled style={{
                      width: '100%', padding: '0.55rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.12)',
                      background: 'transparent', color: 'rgba(255,255,255,0.5)', fontWeight: 600, fontSize: '0.8rem', cursor: 'default',
                    }}>
                      O teu plano
                    </button>
                  ) : plan.priceMonthly === 0 ? (
                    <button disabled style={{
                      width: '100%', padding: '0.55rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.12)',
                      background: 'transparent', color: 'rgba(255,255,255,0.5)', fontWeight: 600, fontSize: '0.8rem', cursor: 'default',
                    }}>
                      Plano grátis
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAssinar(plan.key)}
                      disabled={loadingKey !== null}
                      style={{
                        width: '100%', padding: '0.55rem', borderRadius: '0.5rem', border: 'none',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                        background: 'rgba(165,180,252,0.9)', color: '#0a0a0f', fontWeight: 700, fontSize: '0.8rem',
                        cursor: loadingKey !== null ? 'not-allowed' : 'pointer', opacity: loadingKey !== null && loadingKey !== plan.key ? 0.5 : 1,
                      }}
                    >
                      {loadingKey === plan.key && <Loader2 style={{ width: '0.85rem', height: '0.85rem' }} className="animate-spin" />}
                      Assinar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </DialogContent>
    </Dialog>
  );
}
