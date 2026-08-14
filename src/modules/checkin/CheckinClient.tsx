'use client';

import { useState } from 'react';
import { CheckCircle2, LogOut, MapPin, AlertCircle, CalendarX2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useMyCheckinStatus, useCheckInWithLocation } from '@/hooks/useCheckin';
import { useOrgStore } from '@/stores/orgStore';
import { formatTime } from '@/lib/utils';
import { CheckinManageView } from './CheckinManageView';

interface Props { orgId: string }

export function CheckinClient({ orgId }: Props) {
  const { activeMembership } = useOrgStore();
  const canManage = activeMembership?.role === 'admin' || activeMembership?.role === 'leader';

  if (canManage) return <CheckinManageView orgId={orgId} />;
  return <CheckinSelfView orgId={orgId} />;
}

function CheckinSelfView({ orgId }: Props) {
  const { data: status, isLoading } = useMyCheckinStatus(orgId);
  const checkIn = useCheckInWithLocation(orgId);
  const [locating, setLocating] = useState(false);

  function getLocation(): Promise<{ latitude: number; longitude: number } | null> {
    return new Promise((resolve) => {
      if (!('geolocation' in navigator)) { resolve(null); return; }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 10000 },
      );
    });
  }

  async function handleAction(checkedIn: boolean) {
    if (!status) return;
    setLocating(true);
    try {
      const location = status.orgHasLocation ? await getLocation() : null;
      if (status.orgHasLocation && !location) {
        toast.error('Não conseguimos aceder à tua localização. Ativa o GPS e tenta novamente.');
        return;
      }
      await checkIn.mutateAsync({ scheduleId: status.scheduleId, checkedIn, location });
      toast.success(checkedIn ? 'Presença confirmada!' : 'Até à próxima!');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao confirmar presença');
    } finally {
      setLocating(false);
    }
  }

  const isBusy = locating || checkIn.isPending;

  return (
    <div className="dash-purple-bg" style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: '24rem', width: '100%', padding: '2rem 1.5rem', textAlign: 'center' }}>
        {isLoading ? (
          <Loader2 className="animate-spin" style={{ width: '2rem', height: '2rem', margin: '0 auto', color: 'rgba(255,255,255,0.3)' }} />
        ) : !status ? (
          <>
            <CalendarX2 style={{ width: '2.5rem', height: '2.5rem', margin: '0 auto 1rem', color: 'rgba(255,255,255,0.2)' }} />
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
              Nenhum evento agora
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.4)' }}>
              Não estás escalado em nenhum evento hoje, ou ainda não é a hora.
            </p>
          </>
        ) : status.checkedOutAt ? (
          <>
            <CheckCircle2 style={{ width: '2.5rem', height: '2.5rem', margin: '0 auto 1rem', color: '#6ee7b7' }} />
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
              Até à próxima! 👋
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.4)' }}>
              Check-out registado em {status.eventName}.
            </p>
          </>
        ) : (
          <>
            <div style={{
              width: '3.5rem', height: '3.5rem', borderRadius: '9999px', margin: '0 auto 1.25rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: status.checkedInAt ? 'rgba(110,231,183,0.15)' : 'rgba(165,180,252,0.15)',
            }}>
              {status.checkedInAt
                ? <CheckCircle2 style={{ width: '1.75rem', height: '1.75rem', color: '#6ee7b7' }} />
                : <MapPin style={{ width: '1.75rem', height: '1.75rem', color: '#a5b4fc' }} />}
            </div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '0.25rem' }}>
              {status.eventName}
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', marginBottom: '1.75rem' }}>
              {formatTime(status.eventTime)}
              {status.checkedInAt && ' · presença confirmada'}
            </p>

            {status.orgHasLocation && (
              <p style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
                fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', marginBottom: '1.25rem',
              }}>
                <AlertCircle style={{ width: '0.8rem', height: '0.8rem', flexShrink: 0 }} />
                Precisas de estar perto da igreja para confirmar
              </p>
            )}

            <button
              onClick={() => handleAction(!status.checkedInAt)}
              disabled={isBusy}
              style={{
                width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                padding: '0.875rem', borderRadius: '0.75rem',
                fontSize: '0.95rem', fontWeight: 700,
                background: status.checkedInAt ? 'rgba(255,255,255,0.08)' : '#fff',
                color: status.checkedInAt ? '#fff' : '#0a0a0e',
                border: status.checkedInAt ? '1px solid rgba(255,255,255,0.15)' : 'none',
                cursor: isBusy ? 'wait' : 'pointer', opacity: isBusy ? 0.6 : 1,
              }}
            >
              {isBusy ? (
                <Loader2 className="animate-spin" style={{ width: '1rem', height: '1rem' }} />
              ) : status.checkedInAt ? (
                <LogOut style={{ width: '1rem', height: '1rem' }} />
              ) : (
                <MapPin style={{ width: '1rem', height: '1rem' }} />
              )}
              {isBusy ? 'A confirmar…' : status.checkedInAt ? 'Fazer check-out' : 'Confirmar presença'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
