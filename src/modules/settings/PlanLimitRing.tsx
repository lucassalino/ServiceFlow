'use client';

import { Users, LayoutGrid, ShieldCheck, Star, TrendingUp } from 'lucide-react';
import { usePlanUsage } from '@/hooks/usePlanLimit';
import {
  RESOURCE_LABEL, usagePercent, isAtLimit, isNearLimit,
  type PlanResource, type PlanLimitState,
} from '@/lib/plan-limits';

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
 * do limite, vermelho ao atingi-lo. O anel de líderes aparece mesmo a 0/0
 * (Semente/Broto) — mostra que o plano atual não inclui líderes.
 */
export function PlanLimitRings() {
  const { data, isLoading } = usePlanUsage(true);
  if (isLoading || !data) return null;

  const resources = RING_ORDER.filter((r) => data[r]);
  if (resources.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.85rem' }}>
      {resources.map((r) => (
        <Ring key={r} resource={r} used={data[r].used} limit={data[r].limit} />
      ))}
    </div>
  );
}

/**
 * Aviso de "perto do limite" / "limite atingido" — vivia como toast no
 * dashboard, agora vive aqui nas Definições (junto dos anéis, onde faz
 * sentido agir). Admin fica de fora: é sempre 1, nunca é um limite que um
 * upgrade resolve.
 */
export function PlanLimitNotice({ onUpgrade }: { onUpgrade: () => void }) {
  const { data } = usePlanUsage(true);
  if (!data) return null;

  const entries = (Object.entries(data) as [PlanResource, PlanLimitState][])
    .filter(([resource]) => resource !== 'admin');
  const critical = entries.find(([, s]) => isAtLimit(s)) ?? entries.find(([, s]) => isNearLimit(s));
  if (!critical) return null;

  const [, state] = critical;
  const label = RESOURCE_LABEL[critical[0]];
  const pct = usagePercent(state);
  const atLimit = isAtLimit(state);
  const color = atLimit ? '#f87171' : '#fcd34d';
  const tint = atLimit ? 'rgba(248,113,113,' : 'rgba(252,211,77,';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.85rem',
      padding: '0.7rem 0.85rem', borderRadius: '0.7rem',
      background: `${tint}0.07)`, border: `1px solid ${tint}0.2)`,
    }}>
      <TrendingUp style={{ width: '0.95rem', height: '0.95rem', color, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '0.78rem', color: '#fff', fontWeight: 600, margin: 0 }}>
          {atLimit ? `Atingiste o limite de ${label.many}` : `Estás a usar ${pct}% do limite de ${label.many}`}
        </p>
        <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', margin: '0.1rem 0 0' }}>
          {state.used} de {state.limit} {label.many} · plano {state.planName}
        </p>
      </div>
      <button
        onClick={onUpgrade}
        style={{
          flexShrink: 0, fontSize: '0.75rem', fontWeight: 700, color, cursor: 'pointer',
          padding: '0.35rem 0.7rem', borderRadius: '0.5rem',
          background: `${tint}0.12)`, border: `1px solid ${tint}0.25)`,
        }}
      >
        Ver planos
      </button>
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
  // limit null = ilimitado (anel cheio); limit 0 = plano não inclui este
  // recurso (anel cheio a vermelho, para ficar claro que está bloqueado).
  const filled = limit === null || limit === 0 ? circumference : (pct / 100) * circumference;

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
