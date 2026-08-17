'use client';

import { ExternalLink, Lock, ArrowUpCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RESOURCE_LABEL, type PlanLimitError } from '@/lib/plan-limits';

/** URL do site de apresentação (onde ficam os planos). */
const PLANS_URL = 'https://wis-services.com/planos';

interface Props {
  /** Erro devolvido pela mutation; null fecha o modal. */
  error: PlanLimitError | null;
  onClose: () => void;
  /** true mostra o CTA de upgrade; false mostra "fala com o admin". */
  isAdmin: boolean;
}

export function PlanLimitDialog({ error, onClose, isAdmin }: Props) {
  if (!error) return null;

  const label = RESOURCE_LABEL[error.resource];
  const limitText = error.limit === null ? 'ilimitado' : String(error.limit);

  return (
    <Dialog open={!!error} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div style={{
            width: '2.75rem', height: '2.75rem', borderRadius: '0.75rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--wis-warning-bg)', border: '1px solid #f3ddb6',
            marginBottom: '0.875rem',
          }}>
            <Lock style={{ width: '1.25rem', height: '1.25rem', color: 'var(--wis-warning)' }} />
          </div>
          <DialogTitle>Limite do plano atingido</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--wis-text)' }}>
            {isAdmin ? (
              <>
                O plano <strong style={{ color: 'var(--wis-text)' }}>{error.planName}</strong> permite{' '}
                <strong style={{ color: 'var(--wis-text)' }}>{limitText}</strong> {label.many} e já estás a
                usar <strong style={{ color: 'var(--wis-text)' }}>{error.used}</strong>.
              </>
            ) : (
              <>
                Esta organização atingiu o limite de {label.many} do plano atual. Fala com o
                administrador para que ele possa aumentar o limite.
              </>
            )}
          </p>

          {/* Barra de utilização — só faz sentido quando há limite */}
          {error.limit !== null && (
            <div>
              <div style={{
                height: '0.5rem', borderRadius: '9999px', overflow: 'hidden',
                background: 'var(--wis-surface-3)',
              }}>
                <div style={{
                  width: '100%', height: '100%',
                  background: 'linear-gradient(90deg, var(--wis-warning-bg), var(--wis-danger-bg))',
                }} />
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--wis-text-3)', marginTop: '0.4rem' }}>
                {error.used} de {limitText} {label.many}
              </p>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.625rem', justifyContent: 'flex-end', paddingTop: '0.25rem' }}>
            <Button variant="outline" onClick={onClose}>
              {isAdmin ? 'Agora não' : 'Entendi'}
            </Button>
            {isAdmin && (
              <Button onClick={() => window.open(PLANS_URL, '_blank', 'noopener,noreferrer')}>
                <ArrowUpCircle style={{ width: '0.9rem', height: '0.9rem' }} />
                Ver planos
                <ExternalLink style={{ width: '0.75rem', height: '0.75rem', opacity: 0.6 }} />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
