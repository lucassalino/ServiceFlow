import type { UnavailabilityEntry, UnavailabilityPeriod } from '@/actions/availability';

const WEEKDAY_LABELS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const PERIOD_LABELS: Record<UnavailabilityPeriod, string> = { manha: 'manhã', tarde: 'tarde', noite: 'noite' };

/** Mesmas fronteiras de hora usadas em eventPeriod() (src/lib/utils.ts), só que devolve a chave sem acento. */
function periodKey(time: string | null | undefined): UnavailabilityPeriod | null {
  if (!time) return null;
  const hour = parseInt(time.slice(0, 2), 10);
  if (Number.isNaN(hour)) return null;
  if (hour >= 5 && hour < 12) return 'manha';
  if (hour >= 12 && hour < 18) return 'tarde';
  return 'noite';
}

/**
 * Qual a ocorrência deste dia da semana dentro do mês?
 * Ex.: 9 de agosto sendo domingo, se for o 2º domingo do mês → 2.
 */
export function nthWeekdayOfMonth(date: string): number {
  const day = new Date(date + 'T00:00:00').getDate();
  return Math.floor((day - 1) / 7) + 1;
}

/** true se esta data é a ÚLTIMA ocorrência do seu dia da semana no mês. */
export function isLastWeekdayOfMonth(date: string): boolean {
  const d = new Date(date + 'T00:00:00');
  const month = d.getMonth();
  d.setDate(d.getDate() + 7);
  return d.getMonth() !== month;
}

/** true se a data corresponde a uma regra mensal (N-ésima ocorrência do weekday). */
function matchesMonthlyNth(e: UnavailabilityEntry, date: string, weekday: number): boolean {
  if (e.kind !== 'monthly_nth' || e.weekday !== weekday || e.nth == null) return false;
  if (e.nth === -1) return isLastWeekdayOfMonth(date);
  return nthWeekdayOfMonth(date) === e.nth;
}

/** Devolve a entrada de indisponibilidade que bloqueia esta data/hora, ou null se a pessoa está livre. */
export function findConflictingUnavailability(
  entries: UnavailabilityEntry[] | undefined,
  date: string,
  time?: string | null,
): UnavailabilityEntry | null {
  if (!entries || entries.length === 0) return null;
  const weekday = new Date(date + 'T00:00:00').getDay();
  const key = periodKey(time);

  for (const e of entries) {
    if (e.kind === 'date_range' && e.startDate && e.endDate) {
      if (date >= e.startDate && date <= e.endDate) return e;
    }
    if (e.kind === 'weekly' && e.weekday === weekday) {
      if (!e.period || e.period === key) return e;
    }
    if (matchesMonthlyNth(e, date, weekday)) {
      if (!e.period || e.period === key) return e;
    }
  }
  return null;
}

/** Todas as indisponibilidades que tocam numa data (sem olhar à hora) — útil para marcar dias no calendário. */
export function unavailabilityForDate(entries: UnavailabilityEntry[] | undefined, date: string): UnavailabilityEntry[] {
  if (!entries) return [];
  const weekday = new Date(date + 'T00:00:00').getDay();
  return entries.filter((e) =>
    (e.kind === 'date_range' && !!e.startDate && !!e.endDate && date >= e.startDate && date <= e.endDate) ||
    (e.kind === 'weekly' && e.weekday === weekday) ||
    matchesMonthlyNth(e, date, weekday),
  );
}

/** Descrição curta para mostrar num badge/tooltip. */
export function describeUnavailability(e: UnavailabilityEntry): string {
  if (e.kind === 'date_range') {
    const base = `Indisponível de ${formatShort(e.startDate!)} a ${formatShort(e.endDate!)}`;
    return e.reason ? `${base} — ${e.reason}` : base;
  }
  const day = WEEKDAY_LABELS[e.weekday!];
  const periodSuffix = e.period ? ` à ${PERIOD_LABELS[e.period]}` : '';

  if (e.kind === 'monthly_nth') {
    const ord = e.nth === -1 ? 'última' : `${e.nth}ª`;
    const base = `Indisponível na ${ord} ${day.toLowerCase()}-feira do mês${periodSuffix}`
      // Domingo e sábado não levam "-feira"
      .replace('domingo-feira', 'domingo')
      .replace('sábado-feira', 'sábado');
    return e.reason ? `${base} — ${e.reason}` : base;
  }

  const base = e.period ? `Indisponível ${day.toLowerCase()}${periodSuffix}` : `Indisponível ${day.toLowerCase()}s`;
  return e.reason ? `${base} — ${e.reason}` : base;
}

/** Rótulo curto da ocorrência mensal (para chips e selects). */
export function nthLabel(nth: number): string {
  return nth === -1 ? 'Última' : `${nth}ª`;
}

function formatShort(date: string): string {
  return new Date(date + 'T00:00:00').toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' });
}

export { WEEKDAY_LABELS, PERIOD_LABELS };
