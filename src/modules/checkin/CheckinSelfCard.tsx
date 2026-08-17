'use client';

import { CheckCircle2, LogOut, UserCheck, CalendarX2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useMyCheckinStatus, useCheckInSelf } from '@/hooks/useCheckin';
import { formatTime } from '@/lib/utils';
// [DESATIVADO por agora — leitura de QR pela câmara. Para reativar, repor o
// modal e trocar useCheckInSelf por useCheckInWithScan.]
// import { useState } from 'react';
// import { CheckinScanModal } from './CheckinScanModal';

interface Props {
  orgId: string;
  /** Estilo compacto — usado quando embutido na vista de gestão do admin/líder. */
  compact?: boolean;
}

/** Cartão de auto check-in/check-out — usado tanto para membros como para admin/líder confirmarem a própria presença. */
export function CheckinSelfCard({ orgId, compact = false }: Props) {
  const { data: status, isLoading } = useMyCheckinStatus(orgId);
  const checkIn = useCheckInSelf(orgId);

  async function handleClick(checkedIn: boolean) {
    if (!status) return;
    try {
      await checkIn.mutateAsync({ scheduleId: status.scheduleId, checkedIn });
      toast.success(checkedIn ? 'Presença confirmada!' : 'Até à próxima!');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao confirmar presença');
    }
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: compact ? '1rem' : '2rem' }}>
        <Loader2 className="animate-spin" style={{ width: '1.5rem', height: '1.5rem', color: 'var(--wis-text-3)' }} />
      </div>
    );
  }

  if (!status) {
    return (
      <div style={{ textAlign: 'center', padding: compact ? '1rem' : '2rem' }}>
        <CalendarX2 style={{ width: '1.75rem', height: '1.75rem', margin: '0 auto 0.5rem', color: 'var(--wis-text-4)' }} />
        <p style={{ fontSize: '0.8rem', color: 'var(--wis-text-3)' }}>
          Não estás escalado em nenhum evento hoje, ou ainda não é a hora.
        </p>
      </div>
    );
  }

  if (status.checkedOutAt) {
    return (
      <div style={{ textAlign: 'center', padding: compact ? '1rem' : '2rem' }}>
        <CheckCircle2 style={{ width: '1.75rem', height: '1.75rem', margin: '0 auto 0.5rem', color: 'var(--wis-success)' }} />
        <p style={{ fontSize: '0.85rem', color: 'var(--wis-text-2)' }}>
          Check-out registado em {status.eventName}.
        </p>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '1rem',
      padding: compact ? '0' : '0.5rem 0',
      flexWrap: 'wrap',
    }}>
      <div style={{ flex: 1, minWidth: '10rem' }}>
        <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--wis-text)' }}>{status.eventName}</p>
        <p style={{ fontSize: '0.75rem', color: 'var(--wis-text-3)' }}>
          {formatTime(status.eventTime)}
          {status.checkedInAt && ' · presença confirmada'}
        </p>
      </div>
      <button
        onClick={() => handleClick(!status.checkedInAt)}
        disabled={checkIn.isPending}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.6rem 1.1rem', borderRadius: '0.625rem',
          fontSize: '0.85rem', fontWeight: 700,
          background: status.checkedInAt ? 'var(--wis-surface)' : 'var(--wis-blue)',
          color: status.checkedInAt ? 'var(--wis-text)' : '#fff',
          border: status.checkedInAt ? '1px solid var(--wis-border-strong)' : 'none',
          cursor: checkIn.isPending ? 'wait' : 'pointer', opacity: checkIn.isPending ? 0.6 : 1,
        }}
      >
        {status.checkedInAt ? <LogOut style={{ width: '0.9rem', height: '0.9rem' }} /> : <UserCheck style={{ width: '0.9rem', height: '0.9rem' }} />}
        {status.checkedInAt ? 'Fazer check-out' : 'Fazer check-in'}
      </button>
    </div>
  );
}
