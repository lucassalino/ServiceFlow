'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Mail, Loader2, BellOff, Check, AlertTriangle } from 'lucide-react';
import {
  fetchEmailCandidatesAction,
  sendSchedulePublishedEmailsAction,
  type EmailCandidate,
} from '@/actions/email-notifications';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { FeatureGate } from '@/components/FeatureGate';

interface Props {
  eventId: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

/**
 * Envio manual do email de escala, com escolha de destinatários.
 * O email é complementar: o sino da app e o push continuam a ser o canal principal.
 */
export function EmailNotifyDialog({ eventId, open, onOpenChange }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ['email-candidates', eventId],
    enabled: open && !!eventId,
    queryFn: () => fetchEmailCandidatesAction(eventId!),
  });

  const candidates = data?.candidates ?? [];
  const configured = data?.configured ?? false;

  // Pré-seleciona quem pode mesmo receber (tem email, não optou por sair,
  // e ainda não recebeu o email deste evento).
  useEffect(() => {
    if (!data) return;
    setSelected(new Set(
      candidates.filter(canReceive).map((c) => c.userId),
    ));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const send = useMutation({
    mutationFn: () => sendSchedulePublishedEmailsAction(eventId!, [...selected]),
    onSuccess: (r) => {
      if (r.sent > 0) {
        toast.success(`${r.sent} ${r.sent === 1 ? 'email enviado' : 'emails enviados'}.`);
        onOpenChange(false);
      } else {
        toast.warning(r.note ?? 'Nenhum email foi enviado.');
      }
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : 'Erro ao enviar emails'),
  });

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const eligible = candidates.filter(canReceive);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Notificar por email</DialogTitle>
        </DialogHeader>

        <FeatureGate feature="email_notifications">
        {!configured ? (
          <div style={{
            display: 'flex', gap: '0.625rem', padding: '0.875rem 1rem', borderRadius: '0.75rem',
            background: 'var(--wis-warning-bg)', border: '1px solid #f3ddb6',
          }}>
            <AlertTriangle style={{ width: '1rem', height: '1rem', color: 'var(--wis-warning)', flexShrink: 0, marginTop: '0.1rem' }} />
            <p style={{ fontSize: '0.82rem', color: 'var(--wis-text)', margin: 0, lineHeight: 1.6 }}>
              O envio de emails ainda não está configurado. Assim que a chave do
              serviço de email for adicionada, este botão passa a funcionar — a
              notificação na app continua a funcionar normalmente.
            </p>
          </div>
        ) : isLoading ? (
          <p className="text-sm text-muted-foreground py-2">A carregar…</p>
        ) : candidates.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">Ninguém está escalado neste evento.</p>
        ) : (
          <div className="space-y-3">
            <p style={{ fontSize: '0.82rem', color: 'var(--wis-text-2)', lineHeight: 1.6, margin: 0 }}>
              Escolhe quem recebe o email com os detalhes do evento.
            </p>

            <div style={{
              maxHeight: '18rem', overflowY: 'auto', borderRadius: '0.625rem',
              border: '1px solid var(--wis-border)',
            }}>
              {candidates.map((c, i) => {
                const ok = canReceive(c);
                return (
                  <label
                    key={c.userId}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.625rem 0.75rem',
                      borderBottom: i < candidates.length - 1 ? '1px solid var(--wis-border)' : 'none',
                      cursor: ok ? 'pointer' : 'not-allowed',
                      opacity: ok ? 1 : 0.45,
                    }}
                  >
                    <Checkbox
                      checked={selected.has(c.userId)}
                      disabled={!ok}
                      onCheckedChange={() => ok && toggle(c.userId)}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '0.85rem', color: 'var(--wis-text)', margin: 0,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.name}
                      </p>
                      <p style={{ fontSize: '0.72rem', color: 'var(--wis-text-3)', margin: 0,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {reason(c)}
                      </p>
                    </div>
                    {c.alreadySent && <Check style={{ width: '0.85rem', height: '0.85rem', color: 'var(--wis-success)', flexShrink: 0 }} />}
                    {c.optedOut && <BellOff style={{ width: '0.85rem', height: '0.85rem', color: 'var(--wis-text-3)', flexShrink: 0 }} />}
                  </label>
                );
              })}
            </div>

            {eligible.length === 0 && (
              <p style={{ fontSize: '0.78rem', color: 'var(--wis-warning)', margin: 0 }}>
                Ninguém pode receber: já receberam, desativaram os emails, ou não têm email.
              </p>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.625rem', paddingTop: '0.25rem' }}>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button
                onClick={() => send.mutate()}
                disabled={send.isPending || selected.size === 0}
              >
                {send.isPending
                  ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> A enviar…</>
                  : <><Mail className="h-3.5 w-3.5" /> Enviar a {selected.size}</>}
              </Button>
            </div>
          </div>
        )}
        </FeatureGate>
      </DialogContent>
    </Dialog>
  );
}

function canReceive(c: EmailCandidate): boolean {
  return !!c.email && !c.optedOut && !c.alreadySent;
}

function reason(c: EmailCandidate): string {
  if (!c.email) return 'Sem email';
  if (c.optedOut) return 'Desativou os emails';
  if (c.alreadySent) return 'Já recebeu o email deste evento';
  return c.ministries.join(' · ') || c.email;
}
