'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, X, CalendarOff } from 'lucide-react';
import { useMyUnavailability, useAddUnavailability, useRemoveUnavailability } from '@/hooks/useAvailability';
import { describeUnavailability, WEEKDAY_LABELS } from '@/lib/availability';
import type { UnavailabilityKind, UnavailabilityPeriod } from '@/actions/availability';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker, DateRangePicker } from '@/components/ui/date-picker';

const PERIOD_OPTIONS: { value: UnavailabilityPeriod | 'all'; label: string }[] = [
  { value: 'all', label: 'O dia todo' },
  { value: 'manha', label: 'Manhã' },
  { value: 'tarde', label: 'Tarde' },
  { value: 'noite', label: 'Noite' },
];

export function UnavailabilitySection() {
  const { data: entries = [], isLoading } = useMyUnavailability();
  const addUnavailability = useAddUnavailability();
  const removeUnavailability = useRemoveUnavailability();

  const [kind, setKind] = useState<UnavailabilityKind>('date_range');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [recurringDate, setRecurringDate] = useState<string | null>(null);
  const [period, setPeriod] = useState<UnavailabilityPeriod | 'all'>('all');
  const [reason, setReason] = useState('');

  /** "YYYY-MM-DD" -> day of week (0=domingo…6=sábado), parsed as local date. */
  function weekdayFromDateStr(value: string): number {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d).getDay();
  }

  async function handleAdd() {
    try {
      if (kind === 'date_range') {
        if (!startDate || !endDate) { toast.error('Escolhe a data inicial e a final'); return; }
        if (endDate < startDate) { toast.error('A data final tem de ser depois da inicial'); return; }
        await addUnavailability.mutateAsync({
          kind: 'date_range', startDate, endDate, reason: reason.trim() || null,
        });
      } else {
        if (!recurringDate) { toast.error('Escolhe uma data para indicar o dia da semana'); return; }
        await addUnavailability.mutateAsync({
          kind: 'weekly', weekday: weekdayFromDateStr(recurringDate),
          period: period === 'all' ? null : period,
          reason: reason.trim() || null,
        });
      }
      setStartDate(''); setEndDate(''); setRecurringDate(null); setReason('');
      toast.success('Indisponibilidade adicionada');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao adicionar');
    }
  }

  async function handleRemove(id: string) {
    try {
      await removeUnavailability.mutateAsync(id);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao remover');
    }
  }

  return (
    <div className="dark-inputs" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
        Marca aqui os períodos em que não podes servir — férias, viagens, ou um dia da semana que nunca te dá jeito.
        Fica visível para quem escala, como aviso.
      </p>

      {/* Toggle Pontual / Recorrente */}
      <div style={{ display: 'inline-flex', padding: '0.2rem', borderRadius: '0.625rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', alignSelf: 'flex-start' }}>
        {([
          { key: 'date_range', label: 'Pontual' },
          { key: 'weekly', label: 'Recorrente' },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setKind(key)}
            style={{
              padding: '0.4rem 0.875rem', borderRadius: '0.5rem',
              fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', border: 'none',
              background: kind === key ? '#fff' : 'transparent',
              color: kind === key ? '#0a0a0f' : 'rgba(255,255,255,0.5)',
              transition: 'background 0.12s, color 0.12s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Form */}
      {kind === 'date_range' ? (
        <div className="space-y-1.5">
          <Label>De — até</Label>
          <DateRangePicker
            startValue={startDate || null}
            endValue={endDate || null}
            onChange={({ start, end }) => { setStartDate(start); setEndDate(end); }}
            placeholder="Escolhe o período"
          />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
          <div className="space-y-1.5">
            <Label>Dia da semana</Label>
            <DatePicker value={recurringDate} onChange={setRecurringDate} placeholder="Escolhe uma data" />
            {recurringDate && (
              <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)' }}>
                Repete todas as {WEEKDAY_LABELS[weekdayFromDateStr(recurringDate)]}s
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Período</Label>
            <Select value={period} onValueChange={(v) => setPeriod(v as UnavailabilityPeriod | 'all')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <Label>Motivo (opcional)</Label>
        <Input placeholder="Ex: Férias, trabalho…" value={reason} onChange={(e) => setReason(e.target.value)} />
      </div>

      <button
        type="button"
        onClick={handleAdd}
        disabled={addUnavailability.isPending}
        className="dark-primary-btn"
        style={{ alignSelf: 'flex-start' }}
      >
        <Plus className="h-4 w-4" />
        {addUnavailability.isPending ? 'A adicionar…' : 'Adicionar'}
      </button>

      {/* List */}
      {isLoading ? (
        <div style={{ height: '3rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.05)', animation: 'pulse 2s infinite' }} />
      ) : entries.length === 0 ? (
        <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>
          Sem indisponibilidades registadas.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {entries.map((e) => (
            <div key={e.id} style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.625rem 0.75rem', borderRadius: '0.5rem',
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <CalendarOff style={{ width: '0.9rem', height: '0.9rem', color: '#f87171', flexShrink: 0 }} />
              <p style={{ flex: 1, fontSize: '0.82rem', color: '#fff' }}>{describeUnavailability(e)}</p>
              <button
                type="button"
                onClick={() => handleRemove(e.id)}
                style={{ color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', borderRadius: '0.375rem', flexShrink: 0 }}
                onMouseEnter={(ev) => (ev.currentTarget.style.color = '#f87171')}
                onMouseLeave={(ev) => (ev.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
              >
                <X style={{ width: '0.75rem', height: '0.75rem' }} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
