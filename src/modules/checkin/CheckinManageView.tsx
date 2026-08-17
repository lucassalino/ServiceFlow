'use client';

import { toast } from 'sonner';
import { CalendarX2, UserCheck, Check, Minus } from 'lucide-react';
import { useTodayCheckinOverview } from '@/hooks/useCheckin';
import { useCheckInSchedule } from '@/hooks/useSchedule';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials, formatTime } from '@/lib/utils';
// [DESATIVADO por agora — fluxo de QR/câmara. Para reativar, repor a secção abaixo.]
// import { CheckinQrSection } from './CheckinQrSection';
import { CheckinSelfCard } from './CheckinSelfCard';

interface Props { orgId: string }

export function CheckinManageView({ orgId }: Props) {
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
          <p className="text-xs font-semibold tracking-[0.16em] uppercase" style={{ color: 'var(--wis-text-3)' }}>
            Gestão
          </p>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[color:var(--wis-text)] mt-1">
            Check-in
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--wis-text-3)' }}>
            Quem já confirmou presença nos eventos de hoje
          </p>
        </div>

        {/* ── A tua presença ─────────────────────────────── */}
        <div style={{
          background: 'var(--wis-surface)',
          border: '1px solid var(--wis-border)',
          borderRadius: '0.875rem', padding: '1rem 1.125rem',
        }}>
          <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--wis-text-3)', marginBottom: '0.5rem' }}>
            A tua presença
          </p>
          <CheckinSelfCard orgId={orgId} compact />
        </div>

        {/* ── Today's events ────────────────────────────── */}
        {isLoading ? (
          <div className="space-y-2.5">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl" style={{ background: 'var(--wis-surface-2)' }} />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="events-dark-empty">
            <CalendarX2 className="h-10 w-10 mb-3" style={{ color: 'var(--wis-text-4)' }} />
            <p className="text-sm" style={{ color: 'var(--wis-text-3)' }}>
              Nenhum evento hoje.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.eventId} style={{
                background: 'var(--wis-surface)',
                border: '1px solid var(--wis-border)',
                borderRadius: '0.875rem', overflow: 'hidden',
              }}>
                <div style={{ padding: '0.9rem 1.125rem', borderBottom: '1px solid var(--wis-border)' }}>
                  <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--wis-text)' }}>{event.eventName}</p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--wis-text-3)', marginTop: '0.15rem' }}>
                    {formatTime(event.eventTime)} · {event.people.length} pessoa{event.people.length !== 1 ? 's' : ''} escalada{event.people.length !== 1 ? 's' : ''}
                    {' · '}{event.people.filter((p) => p.checkedInAt).length} com check-in
                  </p>
                </div>
                {event.people.length === 0 ? (
                  <p style={{ padding: '0.875rem 1.125rem', fontSize: '0.8rem', color: 'var(--wis-text-3)' }}>
                    Ninguém escalado.
                  </p>
                ) : (
                  event.people.map((p, idx) => (
                    <div key={p.scheduleId} style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.7rem 1.125rem',
                      borderBottom: idx === event.people.length - 1 ? 'none' : '1px solid var(--wis-border)',
                    }}>
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className="text-xs" style={{ background: 'var(--wis-surface-4)', color: 'var(--wis-text)' }}>
                          {getInitials(p.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--wis-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.name}
                        </p>
                        <p style={{ fontSize: '0.7rem', color: 'var(--wis-text-3)' }}>
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
                          background: p.checkedInAt ? 'var(--wis-blue-soft)' : 'var(--wis-surface-3)',
                          color: p.checkedInAt ? 'var(--wis-blue)' : 'var(--wis-text-3)',
                        }}
                      >
                        <UserCheck style={{ width: '0.85rem', height: '0.85rem' }} />
                      </button>
                      <span title={p.confirmed === true ? 'Confirmado' : p.confirmed === false ? 'Recusou' : 'Pendente'} style={{
                        width: '1.5rem', height: '1.5rem', borderRadius: '50%', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: p.confirmed === true ? 'var(--wis-success-bg)' : p.confirmed === false ? 'var(--wis-danger-bg)' : 'var(--wis-surface-3)',
                        color: p.confirmed === true ? 'var(--wis-success)' : p.confirmed === false ? 'var(--wis-danger)' : 'var(--wis-text-4)',
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

        {/* ── QR code ── [DESATIVADO por agora — o check-in faz-se por botão] ──
        <div style={{
          background: 'var(--wis-surface)',
          border: '1px solid var(--wis-border)',
          borderRadius: '0.875rem', overflow: 'hidden',
        }}>
          <div style={{ padding: '0.9rem 1.125rem', borderBottom: '1px solid var(--wis-border)' }}>
            <h2 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--wis-text)' }}>QR code de check-in</h2>
          </div>
          <div style={{ padding: '1.25rem' }}>
            <CheckinQrSection orgId={orgId} />
          </div>
        </div>
        */}
      </div>
    </div>
  );
}
