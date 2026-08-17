'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Info, Users, CalendarCheck, TrendingUp } from 'lucide-react';
import { useOrgStore } from '@/stores/orgStore';
import { useMinistries } from '@/hooks/useMinistries';
import { fetchEngagementReportAction, type EngagementPerson } from '@/actions/reports';
import { formatDate, getInitials } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-picker';
import { FeatureGate } from '@/components/FeatureGate';

const card: React.CSSProperties = {
  background: 'var(--wis-surface-2)',
  border: '1px solid var(--wis-border)',
  borderRadius: '0.875rem',
};

/** Períodos rápidos, calculados a partir de hoje. */
function presetRange(months: number): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setMonth(from.getMonth() - months);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { from: iso(from), to: iso(to) };
}

export function ReportsClient({ orgId }: { orgId: string }) {
  const { activeMembership } = useOrgStore();
  const canView = activeMembership?.role === 'admin' || activeMembership?.role === 'leader';

  const { data: ministries = [] } = useMinistries();
  const [range, setRange] = useState(() => presetRange(3));
  const [ministryId, setMinistryId] = useState<string>('all');

  const { data, isLoading, error } = useQuery({
    queryKey: ['engagement-report', orgId, range.from, range.to, ministryId],
    enabled: canView,
    queryFn: () => fetchEngagementReportAction(
      orgId, range.from, range.to, ministryId === 'all' ? null : ministryId,
    ),
  });

  const s = data?.summary;
  const responseRate = useMemo(() => {
    if (!s || s.assignments === 0) return null;
    return Math.round(((s.confirmed + s.declined) / s.assignments) * 100);
  }, [s]);
  const confirmRate = useMemo(() => {
    if (!s || s.assignments === 0) return null;
    return Math.round((s.confirmed / s.assignments) * 100);
  }, [s]);

  if (!canView) {
    return (
      <div className="dash-purple-bg" style={{ minHeight: '100%' }}>
        <div className="p-5 md:p-8">
          <p style={{ color: 'var(--wis-text-2)', fontSize: '0.9rem' }}>
            Os relatórios só estão disponíveis para administradores e líderes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="dash-purple-bg">
      <div className="p-5 md:p-8 space-y-6">

        {/* ── Cabeçalho ─────────────────────────────── */}
        <div className="pt-2">
          <p className="text-xs font-semibold tracking-[0.16em] uppercase" style={{ color: 'var(--wis-text-3)' }}>
            Organização
          </p>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[color:var(--wis-text)] mt-1">
            Relatórios
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--wis-text-3)' }}>
            Engajamento da equipa no período escolhido
          </p>
        </div>

        <FeatureGate feature="engagement_reports">
        {/* ── Filtros ───────────────────────────────── */}
        <div className="dark-inputs" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 16rem', minWidth: 0 }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--wis-text-2)', display: 'block', marginBottom: '0.35rem' }}>
              Período
            </label>
            <DateRangePicker
              startValue={range.from}
              endValue={range.to}
              onChange={({ start, end }) => { if (start && end) setRange({ from: start, to: end }); }}
              placeholder="Escolhe o período"
            />
          </div>

          <div style={{ flex: '1 1 12rem', minWidth: 0 }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--wis-text-2)', display: 'block', marginBottom: '0.35rem' }}>
              Ministério
            </label>
            <Select value={ministryId} onValueChange={setMinistryId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os ministérios</SelectItem>
                {ministries.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.icon} {m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div style={{ display: 'flex', gap: '0.375rem' }}>
            {([{ l: '3 meses', m: 3 }, { l: '6 meses', m: 6 }, { l: '1 ano', m: 12 }]).map(({ l, m }) => (
              <button
                key={m}
                onClick={() => setRange(presetRange(m))}
                style={{
                  padding: '0.5rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.78rem',
                  fontWeight: 600, cursor: 'pointer',
                  background: 'var(--wis-surface-3)', border: '1px solid var(--wis-border-strong)',
                  color: 'var(--wis-text-2)', whiteSpace: 'nowrap',
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <p style={{ color: 'var(--wis-danger)', fontSize: '0.875rem' }}>
            {error instanceof Error ? error.message : 'Erro ao carregar o relatório'}
          </p>
        ) : isLoading ? (
          <p style={{ color: 'var(--wis-text-3)', fontSize: '0.875rem' }}>A calcular…</p>
        ) : !s || s.assignments === 0 ? (
          <div style={{ ...card, padding: '2.5rem', textAlign: 'center' }}>
            <TrendingUp style={{ width: '2rem', height: '2rem', color: 'var(--wis-text-4)', margin: '0 auto 0.75rem' }} />
            <p style={{ color: 'var(--wis-text-3)', fontSize: '0.9rem', margin: 0 }}>
              Não há escalas neste período.
            </p>
          </div>
        ) : (
          <>
            {/* ── Resumo ────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(8rem, 1fr))', gap: '0.75rem' }}>
              <Stat label="Eventos" value={String(s.events)} />
              <Stat label="Escalações" value={String(s.assignments)} />
              <Stat label="Pessoas envolvidas" value={String(s.people)} />
              <Stat label="Taxa de resposta" value={responseRate !== null ? `${responseRate}%` : '—'}
                accent={responseRate !== null && responseRate < 50 ? 'var(--wis-warning-bg)' : 'var(--wis-success-bg)'} />
              <Stat label="Confirmações" value={confirmRate !== null ? `${confirmRate}%` : '—'} accent="var(--wis-success-bg)" />
            </div>

            {/* Nota honesta sobre faltas */}
            <div style={{
              display: 'flex', gap: '0.625rem', padding: '0.75rem 1rem', borderRadius: '0.75rem',
              background: 'var(--wis-blue-soft)', border: '1px solid var(--wis-blue-border)',
            }}>
              <Info style={{ width: '0.95rem', height: '0.95rem', color: 'var(--wis-blue)', flexShrink: 0, marginTop: '0.1rem' }} />
              <p style={{ fontSize: '0.78rem', color: 'var(--wis-text-2)', margin: 0, lineHeight: 1.6 }}>
                <strong style={{ color: 'var(--wis-text)' }}>{s.pending}</strong> escalações ficaram
                sem resposta. Isto não significa falta — a app regista a resposta à escala, não a presença
                no evento.
              </p>
            </div>

            {/* ── Distribuição por ministério ────────── */}
            <Section title="Distribuição por ministério" icon={<TrendingUp style={iconStyle} />}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {(data?.ministries ?? []).map((m) => {
                  const pct = Math.round((m.assignments / s.assignments) * 100);
                  return (
                    <div key={m.ministry_id} style={{ ...card, padding: '0.75rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.95rem' }}>{m.icon}</span>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--wis-text)', flex: 1 }}>{m.name}</span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--wis-text-2)' }}>
                          {m.assignments} · {m.people} {m.people === 1 ? 'pessoa' : 'pessoas'}
                        </span>
                      </div>
                      <div style={{ height: '0.375rem', borderRadius: '9999px', background: 'var(--wis-surface-3)', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: m.color || 'var(--wis-blue-soft)' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>

            {/* ── Frequência por pessoa ──────────────── */}
            <Section title="Frequência de participação" icon={<CalendarCheck style={iconStyle} />}>
              <div style={{ ...card, overflow: 'hidden' }}>
                {(data?.people ?? []).map((p, i, arr) => (
                  <PersonRow key={p.user_id} p={p} max={arr[0]?.assignments ?? 1} last={i === arr.length - 1} />
                ))}
              </div>
            </Section>

            {/* ── Quem não serviu ────────────────────── */}
            {(data?.inactive_people.length ?? 0) > 0 && (
              <Section
                title={`Não serviram neste período · ${data!.inactive_people.length}`}
                icon={<Users style={iconStyle} />}
              >
                <div style={{ ...card, padding: '0.875rem 1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {data!.inactive_people.map((p) => (
                    <span key={p.user_id} style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                      padding: '0.25rem 0.6rem 0.25rem 0.25rem', borderRadius: '9999px',
                      background: 'var(--wis-surface-2)', border: '1px solid var(--wis-border)',
                    }}>
                      <Avatar className="h-5 w-5">
                        {p.avatar_url && <AvatarImage src={p.avatar_url} />}
                        <AvatarFallback style={{ fontSize: '0.55rem' }}>{getInitials(p.name)}</AvatarFallback>
                      </Avatar>
                      <span style={{ fontSize: '0.75rem', color: 'var(--wis-text-2)' }}>{p.name}</span>
                    </span>
                  ))}
                </div>
              </Section>
            )}
          </>
        )}
        </FeatureGate>
      </div>
    </div>
  );
}

const iconStyle: React.CSSProperties = { width: '0.85rem', height: '0.85rem' };

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <p style={{
        display: 'flex', alignItems: 'center', gap: '0.4rem',
        fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em',
        textTransform: 'uppercase', color: 'var(--wis-text-3)', margin: 0,
      }}>
        {icon} {title}
      </p>
      {children}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{ ...card, padding: '0.875rem 1rem' }}>
      <p style={{ fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.02em', color: accent ?? 'var(--wis-text)', margin: 0, lineHeight: 1.2 }}>
        {value}
      </p>
      <p style={{ fontSize: '0.7rem', color: 'var(--wis-text-3)', margin: '0.15rem 0 0' }}>{label}</p>
    </div>
  );
}

function PersonRow({ p, max, last }: { p: EngagementPerson; max: number; last: boolean }) {
  const pct = max > 0 ? Math.round((p.assignments / max) * 100) : 0;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
      borderBottom: last ? 'none' : '1px solid var(--wis-border)',
    }}>
      <Avatar className="h-8 w-8 flex-shrink-0">
        {p.avatar_url && <AvatarImage src={p.avatar_url} />}
        <AvatarFallback style={{ fontSize: '0.65rem' }}>{getInitials(p.name)}</AvatarFallback>
      </Avatar>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--wis-text)', margin: 0,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {p.name}
        </p>
        <div style={{ height: '0.25rem', borderRadius: '9999px', background: 'var(--wis-surface-3)', marginTop: '0.3rem', overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: 'var(--wis-blue-soft)' }} />
        </div>
        <p style={{ fontSize: '0.7rem', color: 'var(--wis-text-3)', margin: '0.25rem 0 0' }}>
          {p.confirmed} confirmadas · {p.pending} sem resposta
          {p.declined > 0 && ` · ${p.declined} recusadas`}
          {p.last_served && ` · última: ${formatDate(p.last_served)}`}
        </p>
      </div>

      <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--wis-text)', flexShrink: 0 }}>
        {p.assignments}
      </span>
    </div>
  );
}
