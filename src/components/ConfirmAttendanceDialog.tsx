'use client';

import { Check, X, CalendarCheck2 } from 'lucide-react';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription,
} from '@/components/ui/alert-dialog';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventName: string;
  eventSubtitle?: string;
  /** Estado atual da pessoa: true = confirmada, false = recusou, null = por responder. */
  currentStatus: boolean | null;
  onConfirm: () => void;
  onDecline: () => void;
  isPending?: boolean;
}

/** Popup para a pessoa escalada confirmar ou declinar presença num evento. */
export function ConfirmAttendanceDialog({
  open, onOpenChange, eventName, eventSubtitle, currentStatus, onConfirm, onDecline, isPending = false,
}: Props) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent style={{ maxWidth: '22rem', textAlign: 'center' }}>
        <div style={{
          width: '3rem', height: '3rem', borderRadius: '9999px', margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--wis-blue-soft)',
        }}>
          <CalendarCheck2 style={{ width: '1.4rem', height: '1.4rem', color: 'var(--wis-blue)' }} />
        </div>

        <AlertDialogHeader style={{ textAlign: 'center', alignItems: 'center' }}>
          <AlertDialogTitle style={{ fontSize: '1.1rem' }}>
            Confirmar presença?
          </AlertDialogTitle>
          <AlertDialogDescription style={{ textAlign: 'center' }}>
            {eventName}{eventSubtitle ? ` — ${eventSubtitle}` : ''}
            {currentStatus !== null && (
              <>
                <br />
                <span style={{ fontSize: '0.78rem', opacity: 0.8 }}>
                  {currentStatus ? 'Você já confirmou. Pode mudar a resposta abaixo.' : 'Você já tinha recusado. Pode mudar a resposta abaixo.'}
                </span>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div style={{ display: 'flex', gap: '0.625rem', marginTop: '0.5rem' }}>
          <button
            type="button"
            disabled={isPending}
            onClick={onDecline}
            style={{
              flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
              padding: '0.6rem 0.75rem', borderRadius: '9999px',
              fontSize: '0.85rem', fontWeight: 600,
              background: 'transparent', color: 'var(--wis-danger)',
              border: '1px solid #f5c9cb',
              cursor: isPending ? 'wait' : 'pointer', opacity: isPending ? 0.6 : 1,
            }}
          >
            <X style={{ width: '0.85rem', height: '0.85rem' }} />
            Declinar
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={onConfirm}
            style={{
              flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
              padding: '0.6rem 0.75rem', borderRadius: '9999px',
              fontSize: '0.85rem', fontWeight: 700,
              background: 'var(--wis-surface)', color: 'var(--wis-text)',
              border: '1px solid transparent',
              cursor: isPending ? 'wait' : 'pointer', opacity: isPending ? 0.6 : 1,
            }}
          >
            <Check style={{ width: '0.85rem', height: '0.85rem' }} />
            Confirmar
          </button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
