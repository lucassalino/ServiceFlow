'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Send, Bell, Mail, Check } from 'lucide-react';
import { usePublishEvent } from '@/hooks/useEvents';
import { useNotifyEventSchedules } from '@/hooks/useNotifications';
import { fetchEventScheduledContactsAction, type ScheduledContact } from '@/actions/schedule';
import { buildWhatsAppLink, scheduleMessage } from '@/lib/whatsapp';
import { APP_URL } from '@/lib/app-url';
import { getInitials } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { EmailNotifyDialog } from './EmailNotifyDialog';
import type { Event } from '@/types/models';

interface Props { event: Event; orgName: string }

/**
 * Publica a escala (se ainda não estiver) e abre o fluxo de notificação —
 * WhatsApp, app (sino) e email, cada um manual e independente. Vivia no
 * ecrã de Escalas; passou para o de Eventos, onde já estão as outras ações
 * do evento (exportar, editar).
 */
export function NotifyScheduleButton({ event, orgName }: Props) {
  const [whatsappContacts, setWhatsappContacts] = useState<ScheduledContact[] | null>(null);
  const [sentTo, setSentTo] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [appNotified, setAppNotified] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);

  const publishEvent = usePublishEvent();
  const notifySchedules = useNotifyEventSchedules();

  // Publica a escala (se ainda não estiver) e abre o painel para notificar por WhatsApp.
  async function handlePublishAndOpenWhatsapp() {
    try {
      if (!event.is_published) {
        await publishEvent.mutateAsync({ id: event.id, publish: true });
      }
      const contacts = await fetchEventScheduledContactsAction(event.id);
      if (contacts.length === 0) {
        toast.info('Escala publicada. Ainda não há pessoas escaladas para notificar.');
        return;
      }
      setSentTo(new Set());
      setAppNotified(false);
      // Só pré-seleciona quem tem telemóvel — sem número não há para onde enviar.
      setSelectedIds(new Set(contacts.filter((c) => c.phone).map((c) => c.userId)));
      setWhatsappContacts(contacts);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao publicar escala');
    }
  }

  // Cria a notificação dentro da app (sino) — ação manual e separada do WhatsApp.
  async function handleNotifyApp() {
    try {
      const result = await notifySchedules.mutateAsync({ eventId: event.id, eventName: event.name });
      setAppNotified(true);
      toast.success(`${result.notified} ${result.notified === 1 ? 'pessoa notificada' : 'pessoas notificadas'} na app.`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao notificar');
    }
  }

  function toggleContact(userId: string) {
    const contact = (whatsappContacts ?? []).find((c) => c.userId === userId);
    if (!contact?.phone) return; // sem telemóvel não há para onde enviar
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId); else next.add(userId);
      return next;
    });
  }

  function toggleAllContacts() {
    const withPhone = (whatsappContacts ?? []).filter((c) => c.phone);
    setSelectedIds((prev) => prev.size === withPhone.length ? new Set() : new Set(withPhone.map((c) => c.userId)));
  }

  // Envia à PRÓXIMA pessoa selecionada ainda não enviada (o WhatsApp abre uma conversa de cada vez).
  function handleSendNext() {
    const next = (whatsappContacts ?? []).find((c) => selectedIds.has(c.userId) && !sentTo.has(c.userId));
    if (!next || !next.phone) return;
    const message = scheduleMessage({
      name: next.name,
      orgName,
      ministry: next.ministries.join(' / '),
      eventName: event.name,
      date: event.date,
      time: event.time,
      arrivalTime: event.arrival_time,
      appUrl: APP_URL,
    });
    window.open(buildWhatsAppLink(next.phone, message), '_blank', 'noopener,noreferrer');
    setSentTo((prev) => new Set(prev).add(next.userId));
  }

  return (
    <>
      <button
        onClick={handlePublishAndOpenWhatsapp}
        disabled={publishEvent.isPending}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
          padding: '0.375rem 0.875rem',
          fontSize: '0.775rem', fontWeight: 500,
          background: 'var(--wis-surface-3)',
          border: '1px solid var(--wis-border-strong)',
          borderRadius: '0.5rem',
          color: 'var(--wis-text)', cursor: 'pointer',
          transition: 'background 0.12s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--wis-surface-4)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--wis-surface-3)')}
      >
        <Send style={{ width: '0.875rem', height: '0.875rem' }} />
        {publishEvent.isPending
          ? 'A publicar…'
          : event.is_published ? 'Notificar por WhatsApp' : 'Publicar e notificar'}
      </button>

      {/* WhatsApp — notificar escalados */}
      <Dialog open={!!whatsappContacts} onOpenChange={(v) => { if (!v) setWhatsappContacts(null); }}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Notificar por WhatsApp</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            O WhatsApp não deixa enviar a vários contactos de uma vez — cada clique em <strong>Enviar</strong> abre
            a conversa com a próxima pessoa selecionada. Envia dentro do WhatsApp e volta para continuar.
          </p>

          <div className="flex flex-wrap gap-2 self-start">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleNotifyApp}
              disabled={notifySchedules.isPending || appNotified}
              className="gap-1.5"
            >
              <Bell className="h-3.5 w-3.5" />
              {appNotified ? 'Notificado na app' : notifySchedules.isPending ? 'A notificar…' : 'Notificar na app'}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEmailDialogOpen(true)}
              className="gap-1.5"
            >
              <Mail className="h-3.5 w-3.5" />
              Notificar por email
            </Button>
          </div>

          {(whatsappContacts?.length ?? 0) > 0 && (
            <button type="button" onClick={toggleAllContacts}
              className="self-start text-xs font-medium"
              style={{ color: 'var(--wis-text-2)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              {selectedIds.size === (whatsappContacts ?? []).filter((c) => c.phone).length ? 'Desmarcar todos' : 'Selecionar todos'}
            </button>
          )}

          <div className="space-y-2 mt-1">
            {(whatsappContacts ?? []).map((c) => {
              const sent = sentTo.has(c.userId);
              const checked = selectedIds.has(c.userId);
              const hasPhone = !!c.phone;
              return (
                <div key={c.userId} onClick={() => toggleContact(c.userId)}
                  className="flex items-center gap-3 rounded-lg border p-2.5"
                  style={{
                    borderColor: 'var(--wis-border-strong)',
                    background: checked ? 'var(--wis-surface-3)' : 'var(--wis-surface-2)',
                    cursor: hasPhone ? 'pointer' : 'not-allowed',
                    opacity: hasPhone ? 1 : 0.55,
                  }}>
                  <Checkbox checked={checked} disabled={!hasPhone} style={{ pointerEvents: 'none' }} />
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback className="text-xs" style={{ background: 'var(--wis-surface-4)', color: 'var(--wis-text)' }}>
                      {getInitials(c.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[color:var(--wis-text)] truncate flex items-center gap-1.5">
                      {c.name}
                      {sent && <Check className="h-3.5 w-3.5" style={{ color: 'var(--wis-success)' }} />}
                    </p>
                    <p className="text-xs" style={{ color: hasPhone ? 'var(--wis-text-3)' : 'var(--wis-warning)' }}>
                      {c.phone || 'Sem telemóvel no perfil'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setWhatsappContacts(null)}>Fechar</Button>
            {(() => {
              const selectedContacts = (whatsappContacts ?? []).filter((c) => selectedIds.has(c.userId));
              const remaining = selectedContacts.filter((c) => !sentTo.has(c.userId));
              const done = selectedContacts.length - remaining.length;
              const next = remaining[0];
              const label = remaining.length === 0
                ? 'Todos enviados'
                : `Enviar para ${next.name.split(' ')[0]} (${done + 1}/${selectedContacts.length})`;
              return (
                <Button
                  type="button"
                  onClick={handleSendNext}
                  disabled={remaining.length === 0}
                  className="gap-1.5"
                  style={remaining.length === 0
                    ? { background: 'var(--wis-surface-4)', color: 'var(--wis-text-2)' }
                    : { background: '#25D366', color: 'var(--wis-text)' }}
                >
                  <Send className="h-3.5 w-3.5" />
                  {label}
                </Button>
              );
            })()}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EmailNotifyDialog
        eventId={event.id}
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
      />
    </>
  );
}
