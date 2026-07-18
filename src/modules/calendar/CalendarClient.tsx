'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, CalendarDays, MapPin, Clock, CalendarOff } from 'lucide-react';
import { useEvents } from '@/hooks/useEvents';
import { useMyUnavailability } from '@/hooks/useAvailability';
import { unavailabilityForDate, describeUnavailability } from '@/lib/availability';
import { formatTime, eventPeriod } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { Event } from '@/types/models';

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
  const { data: myUnavailability = [] } = useMyUnavailability();
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [selectedDate, setSelectedDate] = useState<string>(todayISO());

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
  const selectedDayUnavail = unavailabilityForDate(myUnavailability, selectedDate);
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
          <p className="text-xs font-semibold tracking-[0.16em] uppercase text-white/40">Agenda</p>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mt-1">Calendário</h1>
          <p className="text-white/40 text-sm mt-0.5">
            {isLoading ? 'A carregar…' : `${eventsThisMonth} evento${eventsThisMonth !== 1 ? 's' : ''} em ${MONTH_NAMES[cursor.getMonth()].toLowerCase()}`}
          </p>
        </div>

        <div className="cal-layout">

          {/* ── Month grid ─────────────────────────────── */}
          <div className="dash-glass-card overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-5 pb-4">
              <p className="text-lg font-bold text-white">
                {MONTH_NAMES[cursor.getMonth()]} <span className="text-white/40 font-medium">{cursor.getFullYear()}</span>
              </p>
              <div className="flex items-center gap-1.5">
                <button onClick={goToday}
                  className="text-xs font-medium px-2.5 py-1 rounded-md text-white/50 hover:text-white hover:bg-white/08 transition-colors">
                  Hoje
                </button>
                <button onClick={goPrevMonth} aria-label="Mês anterior"
                  className="p-1.5 rounded-md text-white/50 hover:text-white hover:bg-white/08 transition-colors">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button onClick={goNextMonth} aria-label="Mês seguinte"
                  className="p-1.5 rounded-md text-white/50 hover:text-white hover:bg-white/08 transition-colors">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="px-3 pb-4">
              {/* Weekday header */}
              <div className="grid grid-cols-7 mb-1">
                {WEEKDAY_LABELS.map((w) => (
                  <div key={w} className="text-center text-[10px] font-semibold uppercase tracking-wider text-white/30 py-1.5">
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
                      const dayUnavail = unavailabilityForDate(myUnavailability, iso);
                      const isToday = iso === today;
                      const isSelected = iso === selectedDate;
                      return (
                        <button
                          key={di}
                          onClick={() => setSelectedDate(iso)}
                          title={dayUnavail.length > 0 ? dayUnavail.map(describeUnavailability).join(' · ') : undefined}
                          style={{
                            position: 'relative',
                            aspectRatio: '1',
                            borderRadius: '0.625rem',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.2rem',
                            background: isSelected ? 'rgba(255,255,255,0.14)' : isToday ? 'rgba(165,180,252,0.12)' : dayUnavail.length > 0 ? 'rgba(248,113,113,0.06)' : 'transparent',
                            border: isSelected ? '1px solid rgba(255,255,255,0.25)' : isToday ? '1px solid rgba(165,180,252,0.3)' : '1px solid transparent',
                            cursor: 'pointer', transition: 'background 0.12s',
                          }}
                        >
                          {dayUnavail.length > 0 && (
                            <CalendarOff style={{ position: 'absolute', top: '2px', right: '2px', width: '0.6rem', height: '0.6rem', color: '#f87171' }} />
                          )}
                          <span style={{
                            fontSize: '0.78rem', fontWeight: isToday || isSelected ? 700 : 500,
                            color: isSelected ? '#fff' : isToday ? '#a5b4fc' : 'rgba(255,255,255,0.65)',
                          }}>
                            {date.getDate()}
                          </span>
                          {dayEvents.length > 0 && (
                            <div style={{ display: 'flex', gap: '0.15rem' }}>
                              {dayEvents.slice(0, 3).map((e, i) => (
                                <span key={i} style={{
                                  width: '4px', height: '4px', borderRadius: '9999px',
                                  background: e.color ?? '#a5b4fc',
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
              <p className="text-white/40 text-[11px] font-semibold uppercase tracking-widest">
                {selectedLabel}
              </p>
              {selectedDayUnavail.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.625rem' }}>
                  {selectedDayUnavail.map((e) => (
                    <p key={e.id} style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#f87171' }}>
                      <CalendarOff className="h-3 w-3 shrink-0" />
                      {describeUnavailability(e)}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {selectedEvents.length === 0 ? (
              <div className="px-5 pb-8 text-center">
                <CalendarDays className="h-8 w-8 mx-auto mb-3 text-white/15" />
                <p className="text-sm text-white/35">Sem eventos neste dia.</p>
              </div>
            ) : (
              <div>
                {selectedEvents.map((event) => {
                  const color = event.color ?? '#a5b4fc';
                  return (
                    <Link key={event.id} href={`/${orgId}/events?event=${event.id}`} className="dash-glass-event">
                      <div className="w-0.5 self-stretch rounded-full shrink-0" style={{ background: color }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-white truncate">{event.name}</span>
                          {event.is_published
                            ? <Badge className="text-[10px] h-[18px] px-1.5 py-0 bg-white/15 text-white border-white/20 hover:bg-white/15">Publicado</Badge>
                            : <Badge variant="secondary" className="text-[10px] h-[18px] px-1.5 py-0 bg-white/08 text-white/60 border-white/12">Rascunho</Badge>}
                          {(() => {
                            const p = eventPeriod(event.time);
                            return p ? (
                              <span style={{
                                fontSize: '0.62rem', fontWeight: 700, padding: '0.05rem 0.4rem',
                                borderRadius: '9999px', letterSpacing: '0.03em', textTransform: 'uppercase',
                                background: 'rgba(165,180,252,0.15)', color: '#a5b4fc',
                                border: '1px solid rgba(165,180,252,0.25)',
                              }}>
                                {p.emoji} {p.label}
                              </span>
                            ) : null;
                          })()}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-white/40 flex-wrap">
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
