'use client';

import { Users, LayoutGrid, ShieldCheck, Star } from 'lucide-react';
import { usePlanUsage } from '@/hooks/usePlanLimit';
import { RESOURCE_LABEL, usagePercent, type PlanResource } from '@/lib/plan-limits';

// Admin fica de fora: é sempre 1, em qualquer plano — nunca é um limite que
// um upgrade resolve, por isso não faz sentido tratá-lo como "quase cheio".
// Quem varia por plano (e é o que faz sentido mostrar) é o líder.
const RING_ORDER: PlanResource[] = ['people', 'ministry', 'leader'];

const RESOURCE_ICON: Record<PlanResource, typeof Users> = {
  people: Users,
  ministry: LayoutGrid,
  admin: ShieldCheck,
  leader: Star,
};

/**
 * Anéis de utilização dos limites do plano — um por recurso com quantidade
 * (pessoas, ministérios, líderes). Verde normalmente, amarelo a partir de 80%
 * do limite, vermelho ao atingi-lo. O anel de líderes fica de fora quando o
 * plano atual não inclui líderes (limit 0, ex.: Semente/Broto) — mostrar
 * "0/0" a vermelho parecia um erro em vez de "este plano não tem líderes".
 */
export function PlanLimitRings() {
  const { data, isLoading } = usePlanUsage(true);
  if (isLoading || !data) return null;

  const resources = RING_ORDER.filter((r) => data[r] && data[r].limit !== 0);
  if (resources.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.85rem' }}>
      {resources.map((r) => (
        <Ring key={r} resource={r} used={data[r].used} limit={data[r].limit} />
      ))}
    </div>
  );
}

function Ring({ resource, used, limit }: { resource: PlanResource; used: number; limit: number | null }) {
  const label = RESOURCE_LABEL[resource];
  const Icon = RESOURCE_ICON[resource];
  const pct = usagePercent({ used, limit });
  const atLimit = limit !== null && used >= limit;
  const nearLimit = limit !== null && !atLimit && pct >= 80;

  const color = atLimit ? '#f87171' : nearLimit ? '#fcd34d' : '#6ee7b7';
  const size = 56;
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  // limit null = ilimitado (anel cheio).
  const filled = limit === null ? circumference : (pct / 100) * circumference;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={stroke}
          />
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - filled}
            style={{ transition: 'stroke-dashoffset 0.3s ease' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon style={{ width: '1.05rem', height: '1.05rem', color: 'rgba(255,255,255,0.55)' }} />
        </div>
      </div>
      <div>
        <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff', margin: 0 }}>
          {used}{limit === null ? '' : `/${limit}`}
        </p>
        <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', margin: 0, textTransform: 'capitalize' }}>
          {label.many}
        </p>
      </div>
    </div>
  );
}
