'use client';

import { toast } from 'sonner';
import { CalendarX2, UserCheck, Check, Minus } from 'lucide-react';
import { useTodayCheckinOverview } from '@/hooks/useCheckin';
import { useCheckInSchedule } from '@/hooks/useSchedule';
import { useOrgStore } from '@/stores/orgStore';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials, formatTime } from '@/lib/utils';
import { CheckinQrSection } from './CheckinQrSection';

interface Props { orgId: string }

export function CheckinManageView({ orgId }: Props) {
  const { activeOrg } = useOrgStore();
  const { data: events = [], isLoading } = useTodayCheckinOverview(orgId);
  const checkInSchedule = useCheckInSchedule();

  async function handleToggle(scheduleId: string, eventMinistryId: string, checkedIn: boolean) {
    try {
      await checkInSchedule.mutateAsync({ id: scheduleId, eventMinistryId, checkedIn });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro');
    }
  }

  return (
    <div className="dash-purple-bg">
      <div className="p-5 md:p-8 space-y-6">

        {/* ── Header ────────────────────────────────────── */}
        <div className="pt-2">
          <p className="text-xs font-semibold tracking-[0.16em] uppercase" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Gestão
          </p>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mt-1">
            Check-in
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Quem já confirmou presença nos eventos de hoje
          </p>
        </div>

        {/* ── Today's events ────────────────────────────── */}
        {isLoading ? (
          <div className="space-y-2.5">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }} />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="events-dark-empty">
            <CalendarX2 className="h-10 w-10 mb-3" style={{ color: 'rgba(255,255,255,0.2)' }} />
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Nenhum evento hoje.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.eventId} style={{
                background: 'rgba(22,22,26,0.85)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '0.875rem', overflow: 'hidden',
              }}>
                <div style={{ padding: '0.9rem 1.125rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>{event.eventName}</p>
                  <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.15rem' }}>
                    {formatTime(event.eventTime)} · {event.people.length} pessoa{event.people.length !== 1 ? 's' : ''} escalada{event.people.length !== 1 ? 's' : ''}
                    {' · '}{event.people.filter((p) => p.checkedInAt).length} com check-in
                  </p>
                </div>
                {event.people.length === 0 ? (
                  <p style={{ padding: '0.875rem 1.125rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>
                    Ninguém escalado.
                  </p>
                ) : (
                  event.people.map((p, idx) => (
                    <div key={p.scheduleId} style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.7rem 1.125rem',
                      borderBottom: idx === event.people.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.04)',
                    }}>
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className="text-xs" style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}>
                          {getInitials(p.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '0.85rem', fontWeight: 500, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.name}
                        </p>
                        <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)' }}>
                          {p.ministryName}
                          {p.checkedInAt && !p.checkedOutAt && ' · presente'}
                          {p.checkedOutAt && ' · saiu'}
                        </p>
                      </div>
                      <button
                        onClick={() => handleToggle(p.scheduleId, p.eventMinistryId, !p.checkedInAt)}
                        disabled={checkInSchedule.isPending}
                        title={p.checkedInAt ? 'Presente — clique para desmarcar' : 'Marcar presença (check-in)'}
                        style={{
                          width: '1.75rem', height: '1.75rem', borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: 'none', flexShrink: 0, cursor: 'pointer',
                          background: p.checkedInAt ? 'rgba(165,180,252,0.18)' : 'rgba(255,255,255,0.07)',
                          color: p.checkedInAt ? '#a5b4fc' : 'rgba(255,255,255,0.3)',
                        }}
                      >
                        <UserCheck style={{ width: '0.85rem', height: '0.85rem' }} />
                      </button>
                      <span title={p.confirmed === true ? 'Confirmado' : p.confirmed === false ? 'Recusou' : 'Pendente'} style={{
                        width: '1.5rem', height: '1.5rem', borderRadius: '50%', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: p.confirmed === true ? 'rgba(110,231,183,0.15)' : p.confirmed === false ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.06)',
                        color: p.confirmed === true ? '#6ee7b7' : p.confirmed === false ? '#f87171' : 'rgba(255,255,255,0.25)',
                      }}>
                        {p.confirmed === true ? <Check style={{ width: '0.65rem', height: '0.65rem' }} /> : <Minus style={{ width: '0.65rem', height: '0.65rem' }} />}
                      </span>
                    </div>
                  ))
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── QR code / configuração ────────────────────── */}
        {activeOrg && (
          <div style={{
            background: 'rgba(22,22,26,0.85)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '0.875rem', overflow: 'hidden',
          }}>
            <div style={{ padding: '0.9rem 1.125rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <h2 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>QR code e localização</h2>
            </div>
            <div style={{ padding: '1.25rem' }}>
              <CheckinQrSection
                orgId={orgId}
                initialLatitude={activeOrg.checkin_latitude}
                initialLongitude={activeOrg.checkin_longitude}
                initialRadiusMeters={activeOrg.checkin_radius_meters}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
