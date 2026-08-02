'use client';

import { usePlanUsage } from '@/hooks/usePlanLimit';
import { RESOURCE_LABEL, usagePercent, type PlanResource } from '@/lib/plan-limits';

const RING_ORDER: PlanResource[] = ['people', 'ministry', 'admin', 'leader'];

const RESOURCE_ICON: Record<PlanResource, string> = {
  people: '👤',
  ministry: '📋',
  admin: '🛡️',
  leader: '⭐',
};

/**
 * Anéis de utilização dos limites do plano — um por recurso com quantidade
 * (pessoas, ministérios, admin, líderes). Verde normalmente, amarelo a partir
 * de 80% do limite, vermelho ao atingi-lo. Recursos com limite 0 (ex.: líderes
 * no Semente/Broto) não aparecem — esse plano simplesmente não os inclui.
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
  const pct = usagePercent({ used, limit });
  const atLimit = limit !== null && used >= limit;
  const nearLimit = limit !== null && !atLimit && pct >= 80;

  const color = atLimit ? '#f87171' : nearLimit ? '#fcd34d' : '#6ee7b7';
  const size = 56;
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
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
          fontSize: '0.9rem',
        }}>
          {RESOURCE_ICON[resource]}
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
