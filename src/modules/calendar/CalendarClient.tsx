'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, CalendarDays, MapPin, Clock, CalendarOff } from 'lucide-react';
import { useEvents } from '@/hooks/useEvents';
import { useOrgUnavailability } from '@/hooks/useAvailability';
import { useOrgMembers } from '@/hooks/useMembers';
import { unavailabilityForDate, describeUnavailability } from '@/lib/availability';
import { formatTime, eventPeriod, getInitials } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import type { Event } from '@/types/models';
import type { UnavailabilityEntry } from '@/actions/availability';

interface Props { orgId: string }

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
const WEEKDAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function todayISO(): string {
  return toISODate(new Date());
}

export function CalendarClient({ orgId }: Props) {
  const { data: events = [], isLoading } = useEvents();
  const { data: orgUnavailability = {} } = useOrgUnavailability();
  const { data: orgMembers = [] } = useOrgMembers();
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [selectedDate, setSelectedDate] = useState<string>(todayISO());

  const memberById = useMemo(() => {
    const map = new Map<string, { name: string; avatarUrl: string | null }>();
    for (const m of orgMembers) {
      map.set(m.user_id, {
        name: m.profile?.full_name || m.profile?.email || 'Sem nome',
        avatarUrl: m.profile?.avatar_url ?? null,
      });
    }
    return map;
  }, [orgMembers]);

  const unavailabilityEntries = useMemo(
    () => Object.entries(orgUnavailability) as [string, UnavailabilityEntry[]][],
    [orgUnavailability],
  );

  // Quem está indisponível numa data, entre todas as pessoas da organização — usa a mesma lógica
  // de fronteiras de date_range/weekly já usada para indisponibilidade individual.
  function unavailableOnDate(iso: string): { userId: string; name: string; avatarUrl: string | null; entry: UnavailabilityEntry }[] {
    const hits: { userId: string; name: string; avatarUrl: string | null; entry: UnavailabilityEntry }[] = [];
    for (const [userId, entries] of unavailabilityEntries) {
      const member = memberById.get(userId);
      for (const entry of unavailabilityForDate(entries, iso)) {
        hits.push({ userId, name: member?.name ?? 'Sem nome', avatarUrl: member?.avatarUrl ?? null, entry });
      }
    }
    return hits;
  }

  const eventsByDate = useMemo(() => {
    const map = new Map<string, Event[]>();
    for (const e of events as Event[]) {
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    }
    return map;
  }, [events]);

  const eventsThisMonth = useMemo(() => {
    const y = cursor.getFullYear();
    const m = cursor.getMonth();
    return (events as Event[]).filter((e) => {
      const d = new Date(e.date + 'T00:00:00');
      return d.getFullYear() === y && d.getMonth() === m;
    }).length;
  }, [events, cursor]);

  // Grelha do mês, semana começa à segunda-feira, com padding até completar semanas inteiras.
  const weeks = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const startOffset = (firstOfMonth.getDay() + 6) % 7; // 0 = segunda
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    while (cells.length % 7 !== 0) cells.push(null);
    const result: (Date | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) result.push(cells.slice(i, i + 7));
    return result;
  }, [cursor]);

  function goPrevMonth() { setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1)); }
  function goNextMonth() { setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1)); }
  function goToday() {
    const d = new Date(); d.setDate(1);
    setCursor(d);
    setSelectedDate(todayISO());
  }

  const today = todayISO();
  const selectedEvents = (eventsByDate.get(selectedDate) ?? []).slice().sort((a, b) => a.time.localeCompare(b.time));
  const selectedDayUnavail = unavailableOnDate(selectedDate);
  const selectedLabel = new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-PT', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <div className="dash-purple-bg">
      <style>{`
        .cal-layout { display: grid; grid-template-columns: 1fr; gap: 1.25rem; }
        @media (min-width: 1024px) {
          .cal-layout { grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); align-items: start; }
        }
      `}</style>

      <div className="p-5 md:p-8 space-y-6">

        {/* Hero */}
        <div className="space-y-1 pt-2">
          <p className="text-xs font-semibold tracking-[0.16em] uppercase text-[color:var(--wis-text-3)]">Agenda</p>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[color:var(--wis-text)] mt-1">Calendário</h1>
          <p className="text-[color:var(--wis-text-3)] text-sm mt-0.5">
            {isLoading ? 'A carregar…' : `${eventsThisMonth} evento${eventsThisMonth !== 1 ? 's' : ''} em ${MONTH_NAMES[cursor.getMonth()].toLowerCase()}`}
          </p>
        </div>

        <div className="cal-layout">

          {/* ── Month grid ─────────────────────────────── */}
          <div className="dash-glass-card overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-5 pb-4">
              <p className="text-lg font-bold text-[color:var(--wis-text)]">
                {MONTH_NAMES[cursor.getMonth()]} <span className="text-[color:var(--wis-text-3)] font-medium">{cursor.getFullYear()}</span>
              </p>
              <div className="flex items-center gap-1.5">
                <button onClick={goToday}
                  className="text-xs font-medium px-2.5 py-1 rounded-md text-[color:var(--wis-text-2)] hover:text-[color:var(--wis-text)] hover:bg-[var(--wis-surface-2)] transition-colors">
                  Hoje
                </button>
                <button onClick={goPrevMonth} aria-label="Mês anterior"
                  className="p-1.5 rounded-md text-[color:var(--wis-text-2)] hover:text-[color:var(--wis-text)] hover:bg-[var(--wis-surface-2)] transition-colors">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button onClick={goNextMonth} aria-label="Mês seguinte"
                  className="p-1.5 rounded-md text-[color:var(--wis-text-2)] hover:text-[color:var(--wis-text)] hover:bg-[var(--wis-surface-2)] transition-colors">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="px-3 pb-4">
              {/* Weekday header */}
              <div className="grid grid-cols-7 mb-1">
                {WEEKDAY_LABELS.map((w) => (
                  <div key={w} className="text-center text-[10px] font-semibold uppercase tracking-wider text-[color:var(--wis-text-3)] py-1.5">
                    {w}
                  </div>
                ))}
              </div>

              {/* Weeks */}
              <div className="space-y-1">
                {weeks.map((week, wi) => (
                  <div key={wi} className="grid grid-cols-7 gap-1">
                    {week.map((date, di) => {
                      if (!date) return <div key={di} />;
                      const iso = toISODate(date);
                      const dayEvents = eventsByDate.get(iso) ?? [];
                      const dayUnavail = unavailableOnDate(iso);
                      const isToday = iso === today;
                      const isSelected = iso === selectedDate;
                      return (
                        <button
                          key={di}
                          onClick={() => setSelectedDate(iso)}
                          title={dayUnavail.length > 0 ? dayUnavail.map((u) => `${u.name} — ${describeUnavailability(u.entry)}`).join(' · ') : undefined}
                          style={{
                            position: 'relative',
                            aspectRatio: '1',
                            borderRadius: '0.625rem',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.2rem',
                            background: isSelected ? 'var(--wis-surface-4)' : isToday ? 'var(--wis-blue-soft)' : 'transparent',
                            border: isSelected ? '1px solid var(--wis-border-strong)' : isToday ? '1px solid var(--wis-blue-border)' : '1px solid transparent',
                            cursor: 'pointer', transition: 'background 0.12s',
                          }}
                        >
                          {dayUnavail.length > 0 && (
                            <span style={{
                              position: 'absolute', top: '4px', right: '4px',
                              width: '5px', height: '5px', borderRadius: '9999px', background: 'var(--wis-danger-bg)',
                            }} />
                          )}
                          <span style={{
                            fontSize: '0.78rem', fontWeight: isToday || isSelected ? 700 : 500,
                            color: isSelected ? 'var(--wis-text)' : isToday ? 'var(--wis-blue)' : 'var(--wis-text-2)',
                          }}>
                            {date.getDate()}
                          </span>
                          {dayEvents.length > 0 && (
                            <div style={{ display: 'flex', gap: '0.15rem' }}>
                              {dayEvents.slice(0, 3).map((e, i) => (
                                <span key={i} style={{
                                  width: '4px', height: '4px', borderRadius: '9999px',
                                  background: e.color ?? 'var(--wis-blue-soft)',
                                }} />
                              ))}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Selected day events ────────────────────── */}
          <div className="dash-glass-card overflow-hidden">
            <div className="px-5 pt-5 pb-4">
              <p className="text-[color:var(--wis-text-3)] text-[11px] font-semibold uppercase tracking-widest">
                {selectedLabel}
              </p>
              {selectedDayUnavail.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
                  <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--wis-danger)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <CalendarOff className="h-3 w-3" />
                    Indisponíveis
                  </p>
                  {selectedDayUnavail.map((u) => (
                    <div key={u.entry.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <Avatar style={{ width: '1.75rem', height: '1.75rem', flexShrink: 0 }}>
                        {u.avatarUrl && <AvatarImage src={u.avatarUrl} alt={u.name} />}
                        <AvatarFallback style={{ fontSize: '0.65rem', background: 'var(--wis-danger-bg)', color: 'var(--wis-danger)' }}>
                          {getInitials(u.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--wis-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {u.name}
                        </p>
                        <p style={{ fontSize: '0.72rem', color: 'var(--wis-text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {describeUnavailability(u.entry)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedEvents.length === 0 ? (
              <div className="px-5 pb-8 text-center">
                <CalendarDays className="h-8 w-8 mx-auto mb-3 text-[color:var(--wis-text-4)]" />
                <p className="text-sm text-[color:var(--wis-text-3)]">Sem eventos neste dia.</p>
              </div>
            ) : (
              <div>
                {selectedEvents.map((event) => {
                  const color = event.color ?? 'var(--wis-blue-soft)';
                  return (
                    <Link key={event.id} href={`/${orgId}/events?event=${event.id}`} className="dash-glass-event">
                      <div className="w-0.5 self-stretch rounded-full shrink-0" style={{ background: color }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-[color:var(--wis-text)] truncate">{event.name}</span>
                          {event.is_published
                            ? <Badge className="text-[10px] h-[18px] px-1.5 py-0 bg-[var(--wis-surface-2)] text-[color:var(--wis-text)] border-[var(--wis-border-strong)] hover:bg-[var(--wis-surface-2)]">Publicado</Badge>
                            : <Badge variant="secondary" className="text-[10px] h-[18px] px-1.5 py-0 bg-[var(--wis-surface-2)] text-[color:var(--wis-text-2)] border-[var(--wis-border-strong)]">Rascunho</Badge>}
                          {(() => {
                            const p = eventPeriod(event.time);
                            return p ? (
                              <span style={{
                                fontSize: '0.62rem', fontWeight: 700, padding: '0.05rem 0.4rem',
                                borderRadius: '9999px', letterSpacing: '0.03em', textTransform: 'uppercase',
                                background: 'var(--wis-blue-soft)', color: 'var(--wis-blue)',
                                border: '1px solid var(--wis-blue-border)',
                              }}>
                                {p.emoji} {p.label}
                              </span>
                            ) : null;
                          })()}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-[color:var(--wis-text-3)] flex-wrap">
                          {event.time && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />{formatTime(event.time)}
                            </span>
                          )}
                          {event.location && (
                            <span className="flex items-center gap-1 truncate">
                              <MapPin className="h-3 w-3 shrink-0" />{event.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
