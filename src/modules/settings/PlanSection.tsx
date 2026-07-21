'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Sparkles, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { useOrgSubscription, useIsPlatformAdmin, useGrantPlan } from '@/hooks/useSubscription';
import { PLAN_LIST, getPlan, type PlanKey } from '@/lib/plans';
import { PlansDialog } from './PlansDialog';
import { CouponsSection } from './CouponsSection';

function Card({ title, icon, accent, children }: {
  title: string; icon?: React.ReactNode; accent?: boolean; children: React.ReactNode;
}) {
  return (
    <div style={{
      background: 'rgba(22,22,26,0.85)',
      border: `1px solid ${accent ? 'rgba(165,180,252,0.3)' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: '0.875rem', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
    }}>
      <div style={{ padding: '0.9rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {icon}
        <h2 style={{ fontSize: '0.85rem', fontWeight: 700, color: accent ? '#a5b4fc' : '#fff' }}>{title}</h2>
      </div>
      <div style={{ padding: '1.25rem' }}>{children}</div>
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
      {/* Plano atual */}
      <Card title="Plano" icon={<Sparkles style={{ width: '1rem', height: '1rem', color: '#a5b4fc' }} />}>
        {isLoading ? (
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>A carregar…</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>{current.label}</span>
              <span style={{
                fontSize: '0.7rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '9999px',
                background: 'rgba(165,180,252,0.15)', color: '#a5b4fc', border: '1px solid rgba(165,180,252,0.25)',
              }}>{sourceLabel[sub?.source ?? 'free'] ?? sub?.source}</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>
              <span>👤 {current.maxPeople === null ? 'Pessoas ilimitadas' : `Até ${current.maxPeople} pessoas`}</span>
              <span>·</span>
              <span>📋 {current.maxMinistries === null ? 'Ministérios ilimitados' : `${current.maxMinistries} ministério(s)`}</span>
            </div>
            {sub?.expires_at && (
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>
                Expira em {new Date(sub.expires_at).toLocaleDateString('pt-PT')}
              </p>
            )}
            <button
              onClick={() => setPlansOpen(true)}
              style={{
                alignSelf: 'flex-start', marginTop: '0.15rem',
                display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                padding: '0.45rem 0.9rem', borderRadius: '0.5rem',
                background: 'rgba(165,180,252,0.15)', color: '#a5b4fc',
                border: '1px solid rgba(165,180,252,0.3)', cursor: 'pointer',
                fontSize: '0.8rem', fontWeight: 700,
              }}
            >
              Ver planos e upgrade
              <ArrowUpRight style={{ width: '0.85rem', height: '0.85rem' }} />
            </button>
          </div>
        )}
      </Card>

      <PlansDialog open={plansOpen} onOpenChange={setPlansOpen} currentPlan={current.key} />

      {/* Concessão manual — só super-admin da plataforma */}
      {isPlatformAdmin && (
        <Card title="Conceder plano (permissão dev)" accent
          icon={<ShieldCheck style={{ width: '1rem', height: '1rem', color: '#a5b4fc' }} />}>
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
                background: '#a5b4fc', color: '#0a0a0f', fontWeight: 700, fontSize: '0.82rem',
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
