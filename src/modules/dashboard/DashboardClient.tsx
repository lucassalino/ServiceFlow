'use client';

import Link from 'next/link';
import {
  CalendarDays, Users, LayoutGrid,
  MapPin, Clock, ArrowRight,
  CalendarCheck, BookOpen, Cake, TrendingUp,
} from 'lucide-react';
import { useOrgStore } from '@/stores/orgStore';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatTime, getInitials, eventPeriod } from '@/lib/utils';
import type { Event } from '@/types/models';

export interface BirthdayPerson {
  name: string;
  avatarUrl: string | null;
  day: number;
  month: number;
}

interface Props {
  upcomingEvents: Event[];
  pendingConfirmations: number;
  birthdayPeople: BirthdayPerson[];
  orgId: string;
}

const QUICK = (orgId: string) => [
  { label: 'Escalas',     icon: CalendarCheck, href: `/${orgId}/schedule`,    color: 'var(--wis-blue)', bg: 'var(--wis-blue-soft)' },
  { label: 'Repertório',  icon: BookOpen,       href: `/${orgId}/songs`,       color: 'var(--wis-warning)', bg: 'var(--wis-warning-bg)'  },
  { label: 'Pessoas',     icon: Users,          href: `/${orgId}/members`,     color: 'var(--wis-success)', bg: 'var(--wis-success-bg)' },
  { label: 'Ministérios', icon: LayoutGrid,     href: `/${orgId}/ministries`,  color: 'var(--wis-blue)', bg: 'var(--wis-blue-soft)' },
];

function getDateParts(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return {
    month: d.toLocaleString('pt-PT', { month: 'short' }).replace('.', '').toUpperCase(),
    day: d.getDate(),
  };
}

function getNow() {
  return new Date().toLocaleDateString('pt-PT', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

const MONTH_NAMES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

export function DashboardClient({ upcomingEvents, birthdayPeople, orgId }: Props) {
  const { activeMembership, activeOrg } = useOrgStore();
  const firstName = activeMembership?.profile?.full_name?.split(' ')[0] ?? 'Bem-vindo';
  const isAdmin = activeMembership?.role === 'admin';
  const canSeeReports = isAdmin || activeMembership?.role === 'leader';
  const currentMonthName = MONTH_NAMES[new Date().getMonth()];

  return (
    <div className="dash-purple-bg">

      {/* ── Content ─────────────────────────────────── */}
      <div className="p-5 md:p-8 space-y-6">

        {/* Hero */}
        <div className="space-y-1 pt-2">
          <p className="text-xs font-semibold tracking-[0.16em] uppercase text-[color:var(--wis-text-3)]">
            {getNow()}
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-none text-[color:var(--wis-text)]">
            Olá, {firstName}!
          </h1>
          <p className="text-[color:var(--wis-text-2)] text-sm pt-0.5">
            {activeOrg?.name} · {upcomingEvents.length > 0
              ? `${upcomingEvents.length} evento${upcomingEvents.length !== 1 ? 's' : ''} próximo${upcomingEvents.length !== 1 ? 's' : ''}`
              : 'tudo tranquilo por aqui'}
          </p>
        </div>

        {/* Atalho para os relatórios — só quem os pode ver */}
        {canSeeReports && (
          <Link
            href={`/${orgId}/reports`}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.875rem 1rem', borderRadius: '0.875rem', textDecoration: 'none',
              background: 'var(--wis-surface-2)', border: '1px solid var(--wis-border)',
            }}
          >
            <TrendingUp style={{ width: '1rem', height: '1rem', color: 'var(--wis-blue)', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--wis-text)', margin: 0 }}>
                Relatórios de engajamento
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--wis-text-3)', margin: '0.1rem 0 0' }}>
                Participação da equipa por período e ministério
              </p>
            </div>
            <ArrowRight style={{ width: '0.9rem', height: '0.9rem', color: 'var(--wis-text-3)', flexShrink: 0 }} />
          </Link>
        )}

        {/* Upcoming events */}
        <div className="dash-glass-card overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-5 pb-4">
            <p className="text-[color:var(--wis-text-3)] text-[11px] font-semibold uppercase tracking-widest">
              Próximos eventos
            </p>
            <Link href={`/${orgId}/events`}
              className="flex items-center gap-1 text-xs font-medium text-[color:var(--wis-text-2)] hover:text-[color:var(--wis-text)] transition-colors">
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {upcomingEvents.length === 0 ? (
            <div className="px-5 pb-8 text-center">
              <CalendarDays className="h-9 w-9 mx-auto mb-3 text-[color:var(--wis-text-4)]" />
              <p className="text-sm text-[color:var(--wis-text-3)]">Nenhum evento agendado.</p>
              {isAdmin && (
                <Link href={`/${orgId}/events`}
                  className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium px-4 py-2 rounded-lg bg-[var(--wis-surface-2)] border border-[var(--wis-border-strong)] hover:bg-[var(--wis-surface-2)] transition-colors text-[color:var(--wis-text)]">
                  Criar evento <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          ) : (
            <div>
              {upcomingEvents.map((event) => {
                const { month, day } = getDateParts(event.date);
                const color = event.color ?? 'var(--wis-blue-soft)';
                return (
                  <Link key={event.id} href={`/${orgId}/events?event=${event.id}`} className="dash-glass-event">
                    {/* Date bubble */}
                    <div className="flex flex-col items-center justify-center w-11 h-12 rounded-xl shrink-0 text-center"
                      style={{ background: color + '20', color }}>
                      <span className="text-[9px] font-bold tracking-wider">{month}</span>
                      <span className="text-lg font-extrabold leading-none">{day}</span>
                    </div>

                    {/* Colour bar */}
                    <div className="w-0.5 self-stretch rounded-full shrink-0" style={{ background: color }} />

                    {/* Info */}
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

                    <ArrowRight className="h-4 w-4 text-[color:var(--wis-text-4)] shrink-0" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>


        {/* Aniversariantes do mês */}
        {birthdayPeople.length > 0 && (
          <div className="dash-glass-card overflow-hidden">
            <div className="flex items-center gap-2 px-5 pt-5 pb-4">
              <Cake className="h-4 w-4" style={{ color: 'var(--wis-warning)' }} />
              <p className="text-[color:var(--wis-text-3)] text-[11px] font-semibold uppercase tracking-widest">
                Aniversariantes de {currentMonthName}
              </p>
            </div>
            <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {birthdayPeople.map((p, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                  style={{ background: 'var(--wis-surface-2)', border: '1px solid var(--wis-border)' }}>
                  <Avatar className="h-10 w-10 shrink-0">
                    {p.avatarUrl && <AvatarImage src={p.avatarUrl} alt={p.name} />}
                    <AvatarFallback className="text-xs font-semibold"
                      style={{ background: 'var(--wis-warning-bg)', color: 'var(--wis-warning)' }}>
                      {getInitials(p.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[color:var(--wis-text)] truncate">{p.name}</p>
                    <p className="text-xs text-[color:var(--wis-text-3)] flex items-center gap-1">
                      <Cake className="h-3 w-3" style={{ color: 'var(--wis-warning)' }} />
                      {p.day} de {MONTH_NAMES[p.month - 1]}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick links — desktop only */}
        <div className="hidden lg:block dash-glass-card p-5">
          <p className="text-[color:var(--wis-text-3)] text-[11px] font-semibold uppercase tracking-widest mb-3">
            Acesso rápido
          </p>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {QUICK(orgId).map(({ label, icon: Icon, href, color, bg }) => (
              <Link key={label} href={href} className="dash-glass-quick">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: bg, color }}>
                  <Icon style={{ width: '0.875rem', height: '0.875rem' }} />
                </div>
                <span className="truncate">{label}</span>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
