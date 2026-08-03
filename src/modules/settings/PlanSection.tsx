'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Sparkles, ShieldCheck, ArrowUpRight, Settings2, Loader2 } from 'lucide-react';
import { useOrgSubscription, useIsPlatformAdmin, useGrantPlan } from '@/hooks/useSubscription';
import { PLAN_LIST, getPlan, type PlanKey } from '@/lib/plans';
import { PlansDialog } from './PlansDialog';
import { CouponsSection } from './CouponsSection';
import { createBillingPortalSessionAction } from '@/actions/stripe-checkout';
import { PlanLimitRings, PlanLimitNotice } from './PlanLimitRing';

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
  const grantPlan = useGrantPlan();

  const [selected, setSelected] = useState<PlanKey>('semente');
  const [note, setNote] = useState('');
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

  useEffect(() => { if (sub) setSelected(sub.plan); }, [sub]);

  const current = getPlan(sub?.plan);

  async function handleGrant() {
    try {
      await grantPlan.mutateAsync({ orgId, plan: selected, note: note.trim() || undefined });
      toast.success(`Plano "${getPlan(selected).label}" concedido a esta organização`);
      setNote('');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao conceder plano');
    }
  }

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

            {/* Aviso de perto/no limite — vivia como toast na Dashboard, agora fica aqui */}
            <PlanLimitNotice onUpgrade={() => setPlansOpen(true)} />

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

      {/* Concessão manual — só super-admin da plataforma */}
      {isPlatformAdmin && (
        <Card title="Conceder plano (permissão dev)" accent
          icon={<ShieldCheck style={{ width: '1rem', height: '1rem', color: '#8fd0ea' }} />}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)' }}>
              Só tu vês isto. Atribui um plano a esta organização sem pagamento.
            </p>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '0.35rem' }}>Plano</label>
              <select
                value={selected}
                onChange={(e) => setSelected(e.target.value as PlanKey)}
                style={{
                  width: '100%', height: '2.4rem', borderRadius: '0.5rem', padding: '0 0.75rem',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff',
                }}
              >
                {PLAN_LIST.map((p) => (
                  <option key={p.key} value={p.key} style={{ background: '#16161a' }}>
                    {p.label}{p.maxPeople === null ? ' — ilimitado' : ` — até ${p.maxPeople} pessoas`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '0.35rem' }}>Nota (opcional)</label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ex.: parceria, teste, cortesia…"
                style={{
                  width: '100%', height: '2.4rem', borderRadius: '0.5rem', padding: '0 0.75rem',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff',
                }}
              />
            </div>
            <button
              onClick={handleGrant}
              disabled={grantPlan.isPending}
              style={{
                alignSelf: 'flex-start', padding: '0.5rem 1rem', borderRadius: '0.5rem',
                background: '#8fd0ea', color: '#0a0a0f', fontWeight: 700, fontSize: '0.82rem',
                border: 'none', cursor: 'pointer', opacity: grantPlan.isPending ? 0.6 : 1,
              }}
            >
              {grantPlan.isPending ? 'A conceder…' : 'Conceder plano'}
            </button>
          </div>
        </Card>
      )}

      {/* Cupões — resgate (admin da org) + gestão (super-admin) */}
      <CouponsSection orgId={orgId} isAdmin={isAdmin} isPlatformAdmin={!!isPlatformAdmin} />
    </div>
  );
}
