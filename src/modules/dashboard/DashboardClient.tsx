'use client';

import Link from 'next/link';
import {
  CalendarDays, Users, LayoutGrid,
  Clock, ArrowRight,
  CalendarCheck, BookOpen, Cake,
} from 'lucide-react';
import { useOrgStore } from '@/stores/orgStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatTime, getInitials } from '@/lib/utils';
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
  { label: 'Escalas',     icon: CalendarCheck, href: `/${orgId}/schedule` },
  { label: 'Repertório',  icon: BookOpen,      href: `/${orgId}/songs` },
  { label: 'Pessoas',     icon: Users,         href: `/${orgId}/members` },
  { label: 'Ministérios', icon: LayoutGrid,    href: `/${orgId}/ministries` },
];

function getDateParts(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return {
    month: d.toLocaleString('pt-PT', { month: 'short' }).replace('.', '').toUpperCase(),
    day: d.getDate(),
    weekday: d.toLocaleString('pt-PT', { weekday: 'short' }).replace('.', '').toUpperCase(),
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
  const currentMonthName = MONTH_NAMES[new Date().getMonth()];

  return (
    <div className="dash-purple-bg wis-dashboard-bg">
      <div className="wis-page px-5 md:px-8 pb-10">

        {/* ── Saudação ──────────────────────────────────── */}
        <header className="pt-7 pb-6">
          <p className="wis-eyebrow">{getNow()}</p>
          <h1 className="wis-title" style={{ marginTop: '0.5rem' }}>Olá, {firstName}.</h1>
          <p className="text-sm mt-2" style={{ color: 'var(--wis-text-2)' }}>
            {activeOrg?.name}
            {upcomingEvents.length > 0 && (
              <>
                <span style={{ color: 'var(--wis-text-4)' }}> · </span>
                {upcomingEvents.length} evento{upcomingEvents.length !== 1 ? 's' : ''} próximo{upcomingEvents.length !== 1 ? 's' : ''}
              </>
            )}
          </p>
        </header>

        {/* ── Próximos eventos ───────────────────────────── */}
        {upcomingEvents.length > 0 ? (
          <section className="wis-section">
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '1rem' }}>
              <p className="wis-eyebrow">Próximos eventos</p>
              <Link href={`/${orgId}/events`} style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                fontSize: '0.8rem', fontWeight: 500, color: 'var(--wis-blue)', textDecoration: 'none',
              }}>
                Ver todos <ArrowRight style={{ width: '0.8rem', height: '0.8rem' }} />
              </Link>
            </div>

            <div className="wis-event-card" style={{ marginTop: '0.85rem' }}>
              {upcomingEvents.slice(0, 3).map((event) => {
                const { month, day } = getDateParts(event.date);
                return (
                  <Link key={event.id} href={`/${orgId}/events?event=${event.id}`} className="wis-event-row">
                    <div className="wis-event-date-badge">
                      <span>{month}</span>
                      <b>{day}</b>
                    </div>
                    <div className="wis-event-bar" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--wis-text)' }}>
                          {event.name}
                        </span>
                        {!event.is_published && <span className="wis-pill">Rascunho</span>}
                      </div>
                      {event.time && (
                        <span style={{
                          display: 'flex', alignItems: 'center', gap: '0.35rem',
                          fontSize: '0.85rem', color: 'var(--wis-text-3)', marginTop: '0.5rem',
                        }}>
                          <Clock style={{ width: '0.85rem', height: '0.85rem' }} />{formatTime(event.time)}
                        </span>
                      )}
                    </div>
                    <ArrowRight style={{ width: '1rem', height: '1rem', color: 'var(--wis-text-4)', flexShrink: 0, alignSelf: 'center' }} />
                  </Link>
                );
              })}
            </div>
          </section>
        ) : (
          <div style={{ padding: '2.5rem 0', textAlign: 'center' }}>
            <CalendarDays style={{ width: '2rem', height: '2rem', margin: '0 auto 0.75rem', color: 'var(--wis-text-4)' }} />
            <p style={{ fontSize: '0.9rem', color: 'var(--wis-text-2)' }}>Nenhum evento agendado.</p>
            {isAdmin && (
              <Link href={`/${orgId}/events`} className="dark-primary-btn" style={{ marginTop: '1rem' }}>
                Criar evento <ArrowRight style={{ width: '0.9rem', height: '0.9rem' }} />
              </Link>
            )}
          </div>
        )}

        {/* ── Aniversariantes ───────────────────────────── */}
        {birthdayPeople.length > 0 && (
          <section className="wis-section">
            <p className="wis-eyebrow" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Cake style={{ width: '0.85rem', height: '0.85rem', color: 'var(--wis-teal)' }} />
              Aniversariantes de {currentMonthName}
            </p>
            <div className="wis-birthday-grid" style={{ marginTop: '0.75rem' }}>
              {birthdayPeople.map((p, i) => (
                <div key={i} className="dash-glass-quick" style={{ minWidth: 0, cursor: 'default' }}>
                  <Avatar className="h-9 w-9 shrink-0">
                    {p.avatarUrl && <AvatarImage src={p.avatarUrl} alt={p.name} />}
                    <AvatarFallback className="text-xs font-semibold"
                      style={{ background: 'var(--wis-surface-3)', color: 'var(--wis-text-2)' }}>
                      {getInitials(p.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: '0.95rem', fontWeight: 600, color: 'var(--wis-text)', margin: 0,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {p.name}
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--wis-text-3)', margin: '0.1rem 0 0' }}>
                      {p.day} de {MONTH_NAMES[p.month - 1]}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Acesso rápido — desktop ───────────────────── */}
        <section className="wis-section hidden lg:block">
          <p className="wis-eyebrow">Acesso rápido</p>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gap: '0.6rem', marginTop: '0.85rem',
          }}>
            {QUICK(orgId).map(({ label, icon: Icon, href }) => (
              <Link key={label} href={href} className="dash-glass-quick">
                <Icon style={{ width: '1rem', height: '1rem', flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
              </Link>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
