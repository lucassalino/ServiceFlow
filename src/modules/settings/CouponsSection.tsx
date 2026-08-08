'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Ticket } from 'lucide-react';
import { useRedeemCoupon } from '@/hooks/useCoupons';
import { getPlan } from '@/lib/plans';

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

interface Props { orgId: string; isAdmin: boolean }

export function CouponsSection({ orgId, isAdmin }: Props) {
  const redeem = useRedeemCoupon();
  const [code, setCode] = useState('');

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

  if (!isAdmin) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
    </div>
  );
}
