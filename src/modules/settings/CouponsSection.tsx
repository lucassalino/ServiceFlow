'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Ticket, Trash2, Plus } from 'lucide-react';
import { useRedeemCoupon, useCoupons, useCreateCoupon, useDeleteCoupon } from '@/hooks/useCoupons';
import { getPlan, PLAN_LIST, type PlanKey } from '@/lib/plans';

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
          color: accent ? '#a5b4fc' : 'rgba(255,255,255,0.55)',
        }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', height: '2.4rem', borderRadius: '0.5rem', padding: '0 0.75rem',
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff',
};

const labelStyle: React.CSSProperties = { fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '0.35rem' };

interface Props { orgId: string; isAdmin: boolean; isPlatformAdmin: boolean }

export function CouponsSection({ orgId, isAdmin, isPlatformAdmin }: Props) {
  const redeem = useRedeemCoupon();
  const [code, setCode] = useState('');

  const { data: coupons = [] } = useCoupons(isPlatformAdmin);
  const createCoupon = useCreateCoupon();
  const deleteCoupon = useDeleteCoupon();

  const [newCode, setNewCode] = useState('');
  const [newPlan, setNewPlan] = useState<PlanKey>('comunhao');
  const [newDuration, setNewDuration] = useState<string>('');   // dias (vazio = vitalício)
  const [newMaxUses, setNewMaxUses] = useState<string>('');      // vazio = ilimitado

  async function handleRedeem() {
    if (!code.trim()) { toast.error('Escreve um código'); return; }
    try {
      const res = await redeem.mutateAsync({ orgId, code });
      toast.success(`Código aplicado! Plano ${getPlan(res.plan).label} ativo.`);
      setCode('');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao aplicar código');
    }
  }

  async function handleCreate() {
    try {
      await createCoupon.mutateAsync({
        code: newCode,
        plan: newPlan,
        durationDays: newDuration.trim() ? parseInt(newDuration, 10) : null,
        maxUses: newMaxUses.trim() ? parseInt(newMaxUses, 10) : null,
      });
      toast.success('Cupão criado');
      setNewCode(''); setNewDuration(''); setNewMaxUses('');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao criar cupão');
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Resgatar — admin da org */}
      {isAdmin && (
        <Card title="Tenho um código" icon={<Ticket style={{ width: '1rem', height: '1rem', color: '#a5b4fc' }} />}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '10rem' }}>
              <label style={labelStyle}>Código promocional</label>
              <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="EX: IGREJA2026" style={{ ...inputStyle, letterSpacing: '0.08em', fontWeight: 600 }} />
            </div>
            <button onClick={handleRedeem} disabled={redeem.isPending}
              style={{
                height: '2.4rem', padding: '0 1.1rem', borderRadius: '0.5rem', border: 'none',
                background: '#a5b4fc', color: '#0a0a0f', fontWeight: 700, fontSize: '0.82rem',
                cursor: 'pointer', opacity: redeem.isPending ? 0.6 : 1,
              }}>
              {redeem.isPending ? 'A aplicar…' : 'Aplicar'}
            </button>
          </div>
        </Card>
      )}

      {/* Gestão de cupões — super-admin */}
      {isPlatformAdmin && (
        <Card title="Cupões (permissão dev)" accent icon={<Ticket style={{ width: '1rem', height: '1rem', color: '#a5b4fc' }} />}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)' }}>
              Cria códigos que as igrejas usam para desbloquear um plano sem pagar.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Código</label>
                <input value={newCode} onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  placeholder="IGREJA2026" style={{ ...inputStyle, letterSpacing: '0.08em', fontWeight: 600 }} />
              </div>
              <div>
                <label style={labelStyle}>Plano</label>
                <select value={newPlan} onChange={(e) => setNewPlan(e.target.value as PlanKey)} style={inputStyle}>
                  {PLAN_LIST.map((p) => <option key={p.key} value={p.key} style={{ background: '#16161a' }}>{p.label}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Duração (dias)</label>
                <input value={newDuration} onChange={(e) => setNewDuration(e.target.value.replace(/\D/g, ''))}
                  placeholder="vazio = vitalício" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Máx. utilizações</label>
                <input value={newMaxUses} onChange={(e) => setNewMaxUses(e.target.value.replace(/\D/g, ''))}
                  placeholder="vazio = ilimitado" style={inputStyle} />
              </div>
            </div>
            <button onClick={handleCreate} disabled={createCoupon.isPending}
              style={{
                alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                padding: '0.5rem 1rem', borderRadius: '0.5rem', background: '#a5b4fc', color: '#0a0a0f',
                fontWeight: 700, fontSize: '0.82rem', border: 'none', cursor: 'pointer',
                opacity: createCoupon.isPending ? 0.6 : 1,
              }}>
              <Plus style={{ width: '0.85rem', height: '0.85rem' }} />
              {createCoupon.isPending ? 'A criar…' : 'Criar cupão'}
            </button>

            {/* Lista */}
            {coupons.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
                {coupons.map((c) => (
                  <div key={c.id} style={{
                    display: 'flex', alignItems: 'center', gap: '0.6rem',
                    padding: '0.6rem 0.75rem', borderRadius: '0.5rem',
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                  }}>
                    <span style={{ fontWeight: 700, letterSpacing: '0.06em', color: '#fff', fontSize: '0.85rem' }}>{c.code}</span>
                    <span style={{ fontSize: '0.72rem', color: '#a5b4fc' }}>{getPlan(c.plan).label}</span>
                    <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>
                      {c.duration_days ? `${c.duration_days}d` : 'vitalício'}
                      {' · '}
                      {c.used_count}/{c.max_uses ?? '∞'} usos
                    </span>
                    <button onClick={() => deleteCoupon.mutate(c.id)} title="Eliminar"
                      style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', padding: '0.2rem' }}>
                      <Trash2 style={{ width: '0.9rem', height: '0.9rem' }} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
