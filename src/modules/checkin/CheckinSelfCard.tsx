'use client';

import { useState } from 'react';
import { CheckCircle2, LogOut, QrCode, CalendarX2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useMyCheckinStatus, useCheckInWithScan } from '@/hooks/useCheckin';
import { formatTime } from '@/lib/utils';
import { CheckinScanModal } from './CheckinScanModal';

interface Props {
  orgId: string;
  /** Estilo compacto — usado quando embutido na vista de gestão do admin/líder. */
  compact?: boolean;
}

/** Cartão de auto check-in/check-out — usado tanto para membros como para admin/líder confirmarem a própria presença. */
export function CheckinSelfCard({ orgId, compact = false }: Props) {
  const { data: status, isLoading } = useMyCheckinStatus(orgId);
  const checkIn = useCheckInWithScan(orgId);
  const [scanOpen, setScanOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<boolean | null>(null);

  function openScanner(checkedIn: boolean) {
    setPendingAction(checkedIn);
    setScanOpen(true);
  }

  async function handleScan(scannedText: string) {
    if (!status || pendingAction === null) return;
    try {
      await checkIn.mutateAsync({ scheduleId: status.scheduleId, checkedIn: pendingAction, scannedText });
      toast.success(pendingAction ? 'Presença confirmada!' : 'Até à próxima!');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao confirmar presença');
    } finally {
      setPendingAction(null);
    }
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: compact ? '1rem' : '2rem' }}>
        <Loader2 className="animate-spin" style={{ width: '1.5rem', height: '1.5rem', color: 'rgba(255,255,255,0.3)' }} />
      </div>
    );
  }

  if (!status) {
    return (
      <div style={{ textAlign: 'center', padding: compact ? '1rem' : '2rem' }}>
        <CalendarX2 style={{ width: '1.75rem', height: '1.75rem', margin: '0 auto 0.5rem', color: 'rgba(255,255,255,0.2)' }} />
        <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
          Não estás escalado em nenhum evento hoje, ou ainda não é a hora.
        </p>
      </div>
    );
  }

  if (status.checkedOutAt) {
    return (
      <div style={{ textAlign: 'center', padding: compact ? '1rem' : '2rem' }}>
        <CheckCircle2 style={{ width: '1.75rem', height: '1.75rem', margin: '0 auto 0.5rem', color: '#6ee7b7' }} />
        <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
          Check-out registado em {status.eventName}.
        </p>
      </div>
    );
  }

  return (
    <>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '1rem',
        padding: compact ? '0' : '0.5rem 0',
        flexWrap: 'wrap',
      }}>
        <div style={{ flex: 1, minWidth: '10rem' }}>
          <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>{status.eventName}</p>
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
            {formatTime(status.eventTime)}
            {status.checkedInAt && ' · presença confirmada'}
          </p>
        </div>
        <button
          onClick={() => openScanner(!status.checkedInAt)}
          disabled={checkIn.isPending}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.6rem 1.1rem', borderRadius: '0.625rem',
            fontSize: '0.85rem', fontWeight: 700,
            background: status.checkedInAt ? 'rgba(255,255,255,0.08)' : '#fff',
            color: status.checkedInAt ? '#fff' : '#0a0a0e',
            border: status.checkedInAt ? '1px solid rgba(255,255,255,0.15)' : 'none',
            cursor: checkIn.isPending ? 'wait' : 'pointer', opacity: checkIn.isPending ? 0.6 : 1,
          }}
        >
          {status.checkedInAt ? <LogOut style={{ width: '0.9rem', height: '0.9rem' }} /> : <QrCode style={{ width: '0.9rem', height: '0.9rem' }} />}
          {status.checkedInAt ? 'Fazer check-out' : 'Fazer check-in'}
        </button>
      </div>

      <CheckinScanModal open={scanOpen} onOpenChange={setScanOpen} onScan={handleScan} />
    </>
  );
}
