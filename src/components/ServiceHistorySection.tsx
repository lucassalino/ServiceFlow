'use client';

import { useMemo, useState } from 'react';
import { Award } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatDate } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { MyServiceHistory } from '@/actions/schedule';

interface Props {
  history: MyServiceHistory | undefined;
  isLoading?: boolean;
  emptyLabel?: string;
}

const MONTH_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(month: string): string {
  return capitalize(new Date(month + '-01T00:00:00').toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' }));
}

export function ServiceHistorySection({ history, isLoading, emptyLabel }: Props) {
  const [selectedMonth, setSelectedMonth] = useState<string>(() => monthKey(new Date()));

  // Últimos 12 meses, contínuos (com zero nos meses sem serviço) — para o gráfico de tendência.
  const chartData = useMemo(() => {
    const countByMonth = new Map((history?.byMonth ?? []).map((m) => [m.month, m.count]));
    const now = new Date();
    const points: { month: string; label: string; count: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = monthKey(d);
      points.push({ month: key, label: MONTH_SHORT[d.getMonth()], count: countByMonth.get(key) ?? 0 });
    }
    return points;
  }, [history?.byMonth]);

  // Opções do seletor: meses com histórico + o mês atual (garante sempre uma opção válida por omissão).
  const monthOptions = useMemo(() => {
    const set = new Set((history?.byMonth ?? []).map((m) => m.month));
    set.add(monthKey(new Date()));
    return [...set].sort((a, b) => b.localeCompare(a));
  }, [history?.byMonth]);

  const entriesForSelectedMonth = useMemo(
    () => (history?.entries ?? []).filter((e) => e.date.slice(0, 7) === selectedMonth),
    [history?.entries, selectedMonth],
  );

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ height: '2.5rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.05)', animation: 'pulse 2s infinite' }} />
        ))}
      </div>
    );
  }

  if (!history || history.totalAllTime === 0) {
    return (
      <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>
        {emptyLabel ?? 'Ainda não foi escalado(a) para nenhum evento nesta organização.'}
      </p>
    );
  }

  return (
    <>
      <div style={{ marginBottom: '1.25rem' }}>
        <p style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
          {history.totalAllTime}
        </p>
        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.2rem' }}>
          vezes ao todo
        </p>
      </div>

      {/* Gráfico — últimos 12 meses */}
      <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: '0.75rem' }}>
        Por mês
      </p>
      <div style={{ width: '100%', height: 150, marginBottom: '1.75rem' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 11 }} axisLine={false} tickLine={false} width={22} />
            <Tooltip
              contentStyle={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.5rem', fontSize: '0.75rem' }}
              labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
              itemStyle={{ color: '#a5b4fc' }}
              formatter={(value: number) => [`${value}×`, 'Vezes']}
            />
            <Line type="monotone" dataKey="count" stroke="#a5b4fc" strokeWidth={2}
              dot={{ r: 3, fill: '#a5b4fc', strokeWidth: 0 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Seletor de mês + eventos desse mês */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', gap: '0.75rem', flexWrap: 'wrap' }}>
        <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>
          Eventos do mês
        </p>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-44 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map((m) => (
              <SelectItem key={m} value={m}>{monthLabel(m)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {entriesForSelectedMonth.length === 0 ? (
        <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>
          Sem serviço em {monthLabel(selectedMonth).toLowerCase()}.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {entriesForSelectedMonth.map((entry) => (
            <div key={`${entry.eventId}-${entry.ministryName}`} style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.625rem 0.75rem', borderRadius: '0.5rem',
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <Award style={{ width: '0.9rem', height: '0.9rem', color: '#fcd34d', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '0.82rem', fontWeight: 500, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {entry.eventName}
                </p>
                <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)' }}>
                  {formatDate(entry.date)}{entry.ministryName && ` · ${entry.ministryName}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
