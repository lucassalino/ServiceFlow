'use client';

import { useMemo } from 'react';
import { ArrowLeft, CalendarCheck, CalendarX, Clock, History } from 'lucide-react';
import { useMemberHistory } from '@/hooks/useMemberHistory';
import { resolveFunction } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import type { MemberHistoryEntry } from '@/actions/member-history';
import { FeatureGate } from '@/components/FeatureGate';

interface Props {
  userId: string;
  memberName: string;
  memberAvatar?: string | null;
  /** Quando embebido noutra página (ex.: Definições) escondemos o cabeçalho. */
  onBack?: () => void;
}

/** Agrupa as participações por mês ("agosto de 2026"). */
function groupByMonth(entries: MemberHistoryEntry[]) {
  const groups = new Map<string, { label: string; items: MemberHistoryEntry[] }>();
  for (const e of entries) {
    const d = new Date(`${e.eventDate}T00:00:00`);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = new Intl.DateTimeFormat('pt-PT', { month: 'long', year: 'numeric' }).format(d);
    if (!groups.has(key)) groups.set(key, { label, items: [] });
    groups.get(key)!.items.push(e);
  }
  return [...groups.values()];
}

const card: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: '0.875rem',
};

export function MemberHistoryPanel({ userId, memberName, memberAvatar, onBack }: Props) {
  const { data, isLoading } = useMemberHistory(userId);
  const groups = useMemo(() => groupByMonth(data?.entries ?? []), [data]);

  const s = data?.summary;
  const confirmRate =
    s && s.total > 0 ? Math.round((s.confirmed / s.total) * 100) : null;

  return (
    <div className={onBack ? 'dash-purple-bg' : ''} style={onBack ? { minHeight: '100%' } : undefined}>
      <div className={onBack ? 'panel-pad' : ''}>

        {onBack && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
            <button
              onClick={onBack}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                fontSize: '0.8rem', fontWeight: 500, color: 'rgba(255,255,255,0.55)',
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              }}
            >
              <ArrowLeft style={{ width: '0.875rem', height: '0.875rem' }} />
              Voltar
            </button>
            <h1 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: 0 }}>Histórico</h1>
          </div>
        )}

        {/* Cabeçalho da pessoa */}
        {onBack && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.875rem',
            padding: '1rem 1.25rem', borderRadius: '0.875rem', marginBottom: '1.25rem',
            background: 'rgba(165,180,252,0.07)', border: '1px solid rgba(165,180,252,0.14)',
          }}>
            <Avatar className="h-10 w-10 flex-shrink-0">
              {memberAvatar && <AvatarImage src={memberAvatar} />}
              <AvatarFallback style={{ fontSize: '0.75rem', fontWeight: 700, background: 'rgba(165,180,252,0.2)', color: '#a5b4fc' }}>
                {getInitials(memberName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', margin: 0 }}>{memberName}</p>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.38)', margin: '0.1rem 0 0' }}>
                Participações anteriores em escalas
              </p>
            </div>
          </div>
        )}

        <FeatureGate feature="member_history">
        {/* ── Resumo ─────────────────────────────────── */}
        {!isLoading && s && s.total > 0 && (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(7rem, 1fr))',
            gap: '0.75rem', marginBottom: '1.5rem',
          }}>
            <Stat label="Participações" value={String(s.total)} />
            <Stat label="Confirmadas" value={confirmRate !== null ? `${confirmRate}%` : '—'} accent="#6ee7b7" />
            <Stat label="Ministérios" value={String(s.ministries)} />
            <Stat
              label="Último serviço"
              value={s.lastServed ? formatDate(s.lastServed) : '—'}
            />
          </div>
        )}

        {/* ── Lista ──────────────────────────────────── */}
        {isLoading ? (
          <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.4)' }}>A carregar…</p>
        ) : groups.length === 0 ? (
          <div style={{ ...card, padding: '2.5rem 1.5rem', textAlign: 'center' }}>
            <History style={{ width: '2rem', height: '2rem', color: 'rgba(255,255,255,0.15)', margin: '0 auto 0.75rem' }} />
            <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
              Ainda não há participações registadas.
            </p>
            <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.25)', margin: '0.35rem 0 0' }}>
              O histórico mostra apenas eventos que já aconteceram.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {groups.map((g) => (
              <div key={g.label}>
                <p style={{
                  fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em',
                  textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)',
                  marginBottom: '0.625rem',
                }}>
                  {g.label}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {g.items.map((e, i) => (
                    <HistoryRow key={`${e.eventId}-${e.ministryId}-${i}`} entry={e} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        </FeatureGate>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{ ...card, padding: '0.875rem 1rem' }}>
      <p style={{
        fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em',
        color: accent ?? '#fff', margin: 0, lineHeight: 1.2,
      }}>
        {value}
      </p>
      <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.38)', margin: '0.15rem 0 0' }}>
        {label}
      </p>
    </div>
  );
}

function HistoryRow({ entry }: { entry: MemberHistoryEntry }) {
  const color = entry.ministryColor || '#a5b4fc';
  const day = new Date(`${entry.eventDate}T00:00:00`).getDate();

  return (
    <div style={{ ...card, display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.75rem 1rem' }}>
      {/* Dia */}
      <div style={{
        width: '2.5rem', height: '2.5rem', borderRadius: '0.625rem', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `${color}20`, border: `1px solid ${color}35`,
      }}>
        <span style={{ fontSize: '0.95rem', fontWeight: 800, color }}>{day}</span>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: '0.875rem', fontWeight: 600, color: '#fff', margin: 0,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {entry.eventName}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.2rem' }}>
          <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)' }}>
            {entry.ministryIcon ? `${entry.ministryIcon} ` : ''}{entry.ministryName}
          </span>
          {entry.functions.map((f) => {
            const fn = resolveFunction(f);
            return (
              <span key={f} style={{
                fontSize: '0.68rem', fontWeight: 600, padding: '0.1rem 0.45rem',
                borderRadius: '9999px', background: 'rgba(255,255,255,0.07)',
                color: 'rgba(255,255,255,0.55)', whiteSpace: 'nowrap',
              }}>
                {fn.emoji} {fn.label}
              </span>
            );
          })}
        </div>
      </div>

      <StatusBadge confirmed={entry.confirmed} />
    </div>
  );
}

/**
 * `confirmed` null significa "nunca respondeu" — NÃO é falta.
 * Não temos registo de presença real, por isso não inventamos essa métrica.
 */
function StatusBadge({ confirmed }: { confirmed: boolean | null }) {
  const map = {
    yes: { icon: CalendarCheck, label: 'Confirmado', color: '#6ee7b7' },
    no:  { icon: CalendarX,     label: 'Recusado',   color: '#f87171' },
    na:  { icon: Clock,         label: 'Sem resposta', color: 'rgba(255,255,255,0.35)' },
  };
  const k = confirmed === true ? 'yes' : confirmed === false ? 'no' : 'na';
  const { icon: Icon, label, color } = map[k];

  return (
    <span
      title={label}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0,
        fontSize: '0.7rem', fontWeight: 600, color,
      }}
    >
      <Icon style={{ width: '0.85rem', height: '0.85rem' }} />
      <span className="hidden sm:inline">{label}</span>
    </span>
  );
}
