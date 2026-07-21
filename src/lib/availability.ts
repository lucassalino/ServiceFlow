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
  }
  return null;
}

/** Todas as indisponibilidades que tocam numa data (sem olhar à hora) — útil para marcar dias no calendário. */
export function unavailabilityForDate(entries: UnavailabilityEntry[] | undefined, date: string): UnavailabilityEntry[] {
  if (!entries) return [];
  const weekday = new Date(date + 'T00:00:00').getDay();
  return entries.filter((e) =>
    (e.kind === 'date_range' && !!e.startDate && !!e.endDate && date >= e.startDate && date <= e.endDate) ||
    (e.kind === 'weekly' && e.weekday === weekday),
  );
}

/** Descrição curta para mostrar num badge/tooltip. */
export function describeUnavailability(e: UnavailabilityEntry): string {
  if (e.kind === 'date_range') {
    const base = `Indisponível de ${formatShort(e.startDate!)} a ${formatShort(e.endDate!)}`;
    return e.reason ? `${base} — ${e.reason}` : base;
  }
  const day = WEEKDAY_LABELS[e.weekday!];
  const base = e.period ? `Indisponível ${day.toLowerCase()} à ${PERIOD_LABELS[e.period]}` : `Indisponível ${day.toLowerCase()}s`;
  return e.reason ? `${base} — ${e.reason}` : base;
}

function formatShort(date: string): string {
  return new Date(date + 'T00:00:00').toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' });
}

export { WEEKDAY_LABELS, PERIOD_LABELS };
