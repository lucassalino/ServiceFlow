'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, X, Check, Users, ChevronDown, ChevronRight, Send } from 'lucide-react';
import { useEvents } from '@/hooks/useEvents';
import { usePublishEvent } from '@/hooks/useEvents';
import { useMinistries } from '@/hooks/useMinistries';
import { useOrgMembers } from '@/hooks/useMembers';
import { useNotifyEventSchedules } from '@/hooks/useNotifications';
import {
  useEventMinistries,
  useEventSchedules,
  useAddMinistryToEvent,
  useRemoveMinistryFromEvent,
  useAddPersonToSchedule,
  useRemovePersonFromSchedule,
  useConfirmSchedule,
} from '@/hooks/useSchedule';
import { MEMBER_FUNCTIONS, getFunctionLabel, getFunctionEmoji } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Ministry, EventMinistry, EventSchedule } from '@/types/models';

interface Props { orgId: string }

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

// ── Add Ministry Dialog ──────────────────────────────────────────────────────

function AddMinistryDialog({
  open,
  onOpenChange,
  eventId,
  existingMinistryIds,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  eventId: string;
  existingMinistryIds: string[];
}) {
  const { data: allMinistries = [] } = useMinistries();
  const addMinistry = useAddMinistryToEvent();

  const available = allMinistries.filter((m) => !existingMinistryIds.includes(m.id));

  async function handleAdd(ministryId: string) {
    try {
      await addMinistry.mutateAsync({ eventId, ministryId });
      toast.success('Ministério adicionado');
      onOpenChange(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao adicionar');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Adicionar Ministério</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-72">
          {available.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Todos os ministérios já foram adicionados
            </p>
          ) : (
            <div className="space-y-1 pr-3">
              {available.map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleAdd(m.id)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors text-left"
                >
                  <span className="text-xl">{m.icon}</span>
                  <span className="font-medium">{m.name}</span>
                  <span
                    className="ml-auto w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: m.color }}
                  />
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// ── Add Person Dialog ────────────────────────────────────────────────────────

function AddPersonDialog({
  open,
  onOpenChange,
  eventMinistryId,
  assignedUserIds,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  eventMinistryId: string;
  assignedUserIds: string[];
}) {
  const { data: members = [] } = useOrgMembers();
  const addPerson = useAddPersonToSchedule();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedFunctions, setSelectedFunctions] = useState<string[]>([]);

  const available = members.filter((m) => !assignedUserIds.includes(m.user_id) && m.is_active);

  function toggleFunction(key: string) {
    setSelectedFunctions((prev) =>
      prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key],
    );
  }

  async function handleSubmit() {
    if (!selectedUserId) { toast.error('Seleciona uma pessoa'); return; }
    try {
      await addPerson.mutateAsync({
        eventMinistryId,
        userId: selectedUserId,
        functions: selectedFunctions,
      });
      toast.success('Pessoa adicionada à escala');
      setSelectedUserId(null);
      setSelectedFunctions([]);
      onOpenChange(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao adicionar');
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => {
      if (!v) { setSelectedUserId(null); setSelectedFunctions([]); }
      onOpenChange(v);
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Pessoa</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Person picker */}
          <div>
            <p className="text-sm font-medium mb-2">Pessoa</p>
            <ScrollArea className="max-h-40 border rounded-md">
              <div className="p-1">
                {available.map((m) => {
                  const name = m.profile?.full_name ?? m.user_id;
                  return (
                    <button
                      key={m.user_id}
                      onClick={() => setSelectedUserId(m.user_id)}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-accent transition-colors text-left ${selectedUserId === m.user_id ? 'bg-accent' : ''}`}
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px]">{getInitials(name)}</AvatarFallback>
                      </Avatar>
                      <span>{name}</span>
                    </button>
                  );
                })}
                {available.length === 0 && (
                  <p className="text-sm text-muted-foreground p-2 text-center">Sem membros disponíveis</p>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Functions picker */}
          <div>
            <p className="text-sm font-medium mb-2">Funções</p>
            <div className="grid grid-cols-2 gap-1">
              {MEMBER_FUNCTIONS.map((f) => (
                <label
                  key={f.key}
                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent cursor-pointer text-sm"
                >
                  <Checkbox
                    checked={selectedFunctions.includes(f.key)}
                    onCheckedChange={() => toggleFunction(f.key)}
                  />
                  <span>{f.emoji} {f.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={addPerson.isPending || !selectedUserId}>
            {addPerson.isPending ? 'A adicionar…' : 'Adicionar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Ministry Slot ────────────────────────────────────────────────────────────

function MinistrySlot({
  em,
  eventId,
}: {
  em: EventMinistry & { ministry: Ministry };
  eventId: string;
}) {
  const [expanded, setExpanded] = useState(true);
  const [addPersonOpen, setAddPersonOpen] = useState(false);
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);

  const { data: schedules = [], isLoading } = useEventSchedules(em.id);
  const removeMinistry = useRemoveMinistryFromEvent();
  const removePerson = useRemovePersonFromSchedule();
  const confirmSchedule = useConfirmSchedule();

  async function handleRemoveMinistry() {
    try {
      await removeMinistry.mutateAsync({ id: em.id, eventId });
      toast.success('Ministério removido');
      setConfirmRemoveOpen(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro');
    }
  }

  async function handleRemovePerson(schedule: EventSchedule) {
    try {
      await removePerson.mutateAsync({ id: schedule.id, eventMinistryId: em.id });
      toast.success('Pessoa removida');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro');
    }
  }

  async function handleConfirm(schedule: EventSchedule, confirmed: boolean) {
    try {
      await confirmSchedule.mutateAsync({ id: schedule.id, eventMinistryId: em.id, confirmed });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro');
    }
  }

  const assignedUserIds = schedules.map((s) => s.user_id);

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Ministry header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-card">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-2 flex-1 text-left"
        >
          {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          <span className="text-lg">{em.ministry.icon}</span>
          <span className="font-medium">{em.ministry.name}</span>
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: em.ministry.color }}
          />
          <Badge variant="secondary" className="ml-1">
            <Users className="h-3 w-3 mr-1" />
            {schedules.length}
          </Badge>
        </button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setAddPersonOpen(true)}
          className="h-8 gap-1"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="text-xs">Pessoa</span>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setConfirmRemoveOpen(true)}
          disabled={removeMinistry.isPending}
          className="h-8 text-destructive hover:text-destructive"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* People list */}
      {expanded && (
        <div className="divide-y">
          {isLoading ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">A carregar…</div>
          ) : schedules.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              Nenhuma pessoa escalada.{' '}
              <button
                className="underline hover:opacity-70"
                onClick={() => setAddPersonOpen(true)}
              >
                Adicionar
              </button>
            </div>
          ) : (
            schedules.map((schedule) => {
              const name = schedule.profile?.full_name ?? schedule.user_id;
              return (
                <div key={schedule.id} className="flex items-center gap-3 px-4 py-2.5 bg-background hover:bg-muted/30 transition-colors">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">{getInitials(name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{name}</p>
                    {schedule.functions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {schedule.functions.map((fn) => (
                          <span key={fn} className="text-xs text-muted-foreground">
                            {getFunctionEmoji(fn)} {getFunctionLabel(fn)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Confirm toggle */}
                  <button
                    onClick={() => handleConfirm(schedule, !schedule.confirmed)}
                    className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                      schedule.confirmed === true
                        ? 'bg-green-500/20 text-green-600'
                        : schedule.confirmed === false
                        ? 'bg-destructive/20 text-destructive'
                        : 'bg-muted text-muted-foreground'
                    }`}
                    title={schedule.confirmed === true ? 'Confirmado' : schedule.confirmed === false ? 'Recusou' : 'Pendente'}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemovePerson(schedule)}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })
          )}
        </div>
      )}

      <AddPersonDialog
        open={addPersonOpen}
        onOpenChange={setAddPersonOpen}
        eventMinistryId={em.id}
        assignedUserIds={assignedUserIds}
      />

      <AlertDialog open={confirmRemoveOpen} onOpenChange={setConfirmRemoveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover ministério do evento?</AlertDialogTitle>
            <AlertDialogDescription>
              {em.ministry.name} e todas as pessoas escaladas neste ministério serão removidas deste evento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleRemoveMinistry}
              disabled={removeMinistry.isPending}
            >
              {removeMinistry.isPending ? 'A remover…' : 'Remover'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function ScheduleClient({ orgId: _orgId }: Props) {
  const { data: events = [], isLoading: eventsLoading } = useEvents();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [addMinistryOpen, setAddMinistryOpen] = useState(false);

  const { data: eventMinistries = [], isLoading: emLoading } = useEventMinistries(selectedEventId);
  const publishEvent = usePublishEvent();
  const notifySchedules = useNotifyEventSchedules();

  const selectedEvent = events.find((e) => e.id === selectedEventId) ?? null;

  async function handlePublishAndNotify() {
    if (!selectedEvent) return;
    try {
      if (!selectedEvent.is_published) {
        await publishEvent.mutateAsync({ id: selectedEvent.id, publish: true });
      }
      const result = await notifySchedules.mutateAsync({
        eventId: selectedEvent.id,
        eventName: selectedEvent.name,
      });
      if (result.notified === 0) {
        toast.info('Escala publicada. Ainda não há pessoas escaladas para notificar.');
      } else {
        toast.success(
          `Escala publicada e ${result.notified} ${result.notified === 1 ? 'pessoa notificada' : 'pessoas notificadas'}.`,
        );
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao publicar escala');
    }
  }

  // Sort events: upcoming first
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const existingMinistryIds = eventMinistries.map((em) => em.ministry_id);

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      {/* Event list sidebar */}
      <aside className="w-64 flex-shrink-0 border-r overflow-y-auto">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
            Eventos
          </h2>
        </div>
        {eventsLoading ? (
          <div className="p-4 text-sm text-muted-foreground">A carregar…</div>
        ) : sortedEvents.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">Sem eventos criados</div>
        ) : (
          <ul className="py-1">
            {sortedEvents.map((event) => (
              <li key={event.id}>
                <button
                  onClick={() => setSelectedEventId(event.id)}
                  className={`w-full text-left px-4 py-3 hover:bg-accent transition-colors ${
                    selectedEventId === event.id ? 'bg-accent font-medium' : ''
                  }`}
                >
                  <p className="text-sm font-medium truncate">{event.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(event.date)} {event.time ? event.time.slice(0, 5) : ''}
                  </p>
                  {event.location && (
                    <p className="text-xs text-muted-foreground truncate">{event.location}</p>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>

      {/* Main area */}
      <main className="flex-1 overflow-y-auto">
        {!selectedEvent ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <p className="text-lg font-medium">Seleciona um evento</p>
              <p className="text-sm mt-1">Escolhe um evento na lista à esquerda</p>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-6 max-w-3xl">
            {/* Event header */}
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold">{selectedEvent.name}</h1>
                <p className="text-muted-foreground mt-1">
                  {formatDate(selectedEvent.date)}
                  {selectedEvent.time && ` · ${selectedEvent.time.slice(0, 5)}`}
                  {selectedEvent.location && ` · ${selectedEvent.location}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {selectedEvent.is_published ? (
                  <Badge>Publicado</Badge>
                ) : (
                  <Badge variant="secondary">Rascunho</Badge>
                )}
                <Button
                  onClick={handlePublishAndNotify}
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  disabled={publishEvent.isPending || notifySchedules.isPending}
                >
                  <Send className="h-4 w-4" />
                  {publishEvent.isPending || notifySchedules.isPending
                    ? 'A publicar…'
                    : selectedEvent.is_published
                    ? 'Notificar escala'
                    : 'Publicar e notificar'}
                </Button>
                <Button onClick={() => setAddMinistryOpen(true)} size="sm" className="gap-1">
                  <Plus className="h-4 w-4" />
                  Ministério
                </Button>
              </div>
            </div>

            {/* Ministry slots */}
            {emLoading ? (
              <div className="text-sm text-muted-foreground">A carregar escalas…</div>
            ) : eventMinistries.length === 0 ? (
              <div className="border-2 border-dashed rounded-lg p-10 text-center">
                <p className="text-muted-foreground font-medium">Nenhum ministério neste evento</p>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  Adiciona ministérios para começar a escalar pessoas
                </p>
                <Button onClick={() => setAddMinistryOpen(true)} variant="outline" className="gap-1">
                  <Plus className="h-4 w-4" />
                  Adicionar Ministério
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {(eventMinistries as (EventMinistry & { ministry: Ministry })[]).map((em) => (
                  <MinistrySlot
                    key={em.id}
                    em={em}
                    eventId={selectedEvent.id}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Add Ministry Dialog */}
      {selectedEvent && (
        <AddMinistryDialog
          open={addMinistryOpen}
          onOpenChange={setAddMinistryOpen}
          eventId={selectedEvent.id}
          existingMinistryIds={existingMinistryIds}
        />
      )}
    </div>
  );
}
