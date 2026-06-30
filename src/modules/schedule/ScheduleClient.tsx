'use client';

import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import {
  Plus, X, Check, Users, ChevronDown, ChevronRight,
  Send, Pencil, CalendarDays, ArrowLeft,
} from 'lucide-react';
import { useEvents, usePublishEvent } from '@/hooks/useEvents';
import { useOrgStore } from '@/stores/orgStore';
import { useMinistries } from '@/hooks/useMinistries';
import { useOrgMembers, useMinistryMembers } from '@/hooks/useMembers';
import { useNotifyEventSchedules } from '@/hooks/useNotifications';
import {
  useEventMinistries,
  useEventSchedules,
  useAddMinistryToEvent,
  useRemoveMinistryFromEvent,
  useAddPersonToSchedule,
  useRemovePersonFromSchedule,
  useConfirmSchedule,
  useUpdateEventSchedule,
} from '@/hooks/useSchedule';
import { MEMBER_FUNCTIONS, getFunctionLabel, getFunctionEmoji } from '@/lib/constants';
import { formatDate, getInitials } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Ministry, EventMinistry, EventSchedule, MinistryMember } from '@/types/models';

interface Props { orgId: string }

// ── Shared dark badge ────────────────────────────────────────────────────────

function DarkBadge({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
      fontSize: '0.7rem', fontWeight: 600, padding: '0.15rem 0.5rem',
      borderRadius: '9999px', letterSpacing: '0.04em',
      background: color ? `${color}22` : 'rgba(255,255,255,0.08)',
      color: color ?? 'rgba(255,255,255,0.55)',
      border: `1px solid ${color ? `${color}44` : 'rgba(255,255,255,0.1)'}`,
    }}>{children}</span>
  );
}

// ── Add Ministry Dialog ──────────────────────────────────────────────────────

function AddMinistryDialog({
  open, onOpenChange, eventId, existingMinistryIds,
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
        <DialogHeader><DialogTitle>Adicionar Ministério</DialogTitle></DialogHeader>
        <ScrollArea className="max-h-72">
          {available.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Todos os ministérios já foram adicionados
            </p>
          ) : (
            <div className="space-y-1 pr-3">
              {available.map((m) => (
                <button key={m.id} onClick={() => handleAdd(m.id)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors text-left">
                  <span className="text-xl">{m.icon}</span>
                  <span className="font-medium">{m.name}</span>
                  <span className="ml-auto w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: m.color }} />
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// ── Person Dialog ────────────────────────────────────────────────────────────

function PersonDialog({
  open, onOpenChange, mode, eventMinistryId, ministryId, assignedUserIds, editTarget,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: 'add' | 'edit';
  eventMinistryId: string;
  ministryId: string;
  assignedUserIds: string[];
  editTarget?: EventSchedule | null;
}) {
  const { data: members = [] } = useOrgMembers();
  const { data: ministryMembers = [] } = useMinistryMembers(ministryId);
  const addPerson = useAddPersonToSchedule();
  const updateSchedule = useUpdateEventSchedule();

  const [selectedUserId, setSelectedUserId] = useState<string | null>(
    mode === 'edit' && editTarget ? editTarget.user_id : null,
  );
  const [selectedFunctions, setSelectedFunctions] = useState<string[]>(
    mode === 'edit' && editTarget ? editTarget.functions : [],
  );

  const available = mode === 'add'
    ? (members as unknown as { user_id: string; is_active: boolean; profile: { full_name: string } }[])
        .filter((m) => !assignedUserIds.includes(m.user_id) && m.is_active)
    : [];

  const availableFunctions = useMemo(() => {
    const allFns = new Set<string>();
    (ministryMembers as unknown as MinistryMember[]).forEach((m) => {
      m.functions.forEach((fn) => allFns.add(fn));
    });
    return allFns.size > 0
      ? MEMBER_FUNCTIONS.filter((f) => allFns.has(f.key))
      : MEMBER_FUNCTIONS;
  }, [ministryMembers]);

  function handleSelectPerson(userId: string) {
    setSelectedUserId(userId);
    const mm = (ministryMembers as unknown as MinistryMember[]).find((m) => m.user_id === userId);
    const preSelected = (mm?.functions ?? []).filter((fn) => availableFunctions.some((f) => f.key === fn));
    setSelectedFunctions(preSelected);
  }

  function toggleFunction(key: string) {
    setSelectedFunctions((prev) =>
      prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key],
    );
  }

  async function handleSubmit() {
    if (mode === 'add') {
      if (!selectedUserId) { toast.error('Seleciona uma pessoa'); return; }
      try {
        await addPerson.mutateAsync({ eventMinistryId, userId: selectedUserId, functions: selectedFunctions });
        toast.success('Pessoa adicionada à escala');
        setSelectedUserId(null);
        setSelectedFunctions([]);
        onOpenChange(false);
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : 'Erro ao adicionar');
      }
    } else {
      if (!editTarget) return;
      try {
        await updateSchedule.mutateAsync({ id: editTarget.id, functions: selectedFunctions });
        toast.success('Escala actualizada');
        onOpenChange(false);
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : 'Erro ao actualizar');
      }
    }
  }

  function handleClose(v: boolean) {
    if (!v && mode === 'add') { setSelectedUserId(null); setSelectedFunctions([]); }
    onOpenChange(v);
  }

  const editPersonName = mode === 'edit' && editTarget
    ? (editTarget.profile?.full_name ?? editTarget.user_id) : null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Adicionar Pessoa' : 'Editar Escala'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {mode === 'edit' && editPersonName && (
            <p className="text-sm font-medium">{editPersonName}</p>
          )}
          {mode === 'add' && (
            <div>
              <p className="text-sm font-medium mb-2">Pessoa</p>
              <ScrollArea className="max-h-40 border rounded-md">
                <div className="p-1">
                  {available.map((m) => {
                    const name = m.profile?.full_name ?? m.user_id;
                    return (
                      <button key={m.user_id} onClick={() => handleSelectPerson(m.user_id)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-accent transition-colors text-left ${selectedUserId === m.user_id ? 'bg-accent' : ''}`}>
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
          )}
          <div>
            <p className="text-sm font-medium mb-2">
              Funções
              {availableFunctions.length < MEMBER_FUNCTIONS.length && (
                <span className="text-xs text-muted-foreground ml-1">(filtradas pelo ministério)</span>
              )}
            </p>
            {mode === 'add' && !selectedUserId ? (
              <p className="text-xs text-muted-foreground">Seleciona uma pessoa primeiro</p>
            ) : (
              <div className="grid grid-cols-2 gap-1">
                {availableFunctions.map((f) => (
                  <label key={f.key} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent cursor-pointer text-sm">
                    <Checkbox checked={selectedFunctions.includes(f.key)} onCheckedChange={() => toggleFunction(f.key)} />
                    <span>{f.emoji} {f.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            disabled={(mode === 'add' ? addPerson.isPending : updateSchedule.isPending) || (mode === 'add' && !selectedUserId)}
          >
            {mode === 'add'
              ? (addPerson.isPending ? 'A adicionar…' : 'Adicionar')
              : (updateSchedule.isPending ? 'A guardar…' : 'Guardar')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Ministry Slot ────────────────────────────────────────────────────────────

function MinistrySlot({ em, eventId, isAdmin }: { em: EventMinistry & { ministry: Ministry }; eventId: string; isAdmin: boolean }) {
  const [expanded, setExpanded] = useState(true);
  const [addPersonOpen, setAddPersonOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<EventSchedule | null>(null);
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
  const color = em.ministry.color;

  return (
    <div style={{
      background: 'rgba(22,22,26,0.85)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '0.875rem',
      overflow: 'hidden',
      boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        padding: '0.875rem 1rem',
        borderBottom: expanded ? '1px solid rgba(255,255,255,0.06)' : 'none',
      }}>
        {/* Left colour accent */}
        <div style={{ width: 3, alignSelf: 'stretch', borderRadius: 9999, background: color, flexShrink: 0 }} />

        <button
          onClick={() => setExpanded((v) => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', color: '#fff' }}
        >
          {expanded
            ? <ChevronDown style={{ width: '1rem', height: '1rem', color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
            : <ChevronRight style={{ width: '1rem', height: '1rem', color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />}
          <span style={{ fontSize: '1.125rem' }}>{em.ministry.icon}</span>
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{em.ministry.name}</span>
          <DarkBadge color={color}>
            <Users style={{ width: '0.65rem', height: '0.65rem' }} />
            {schedules.length}
          </DarkBadge>
        </button>

        {/* Actions — admin only */}
        {isAdmin && (
          <>
            <button
              onClick={() => setAddPersonOpen(true)}
              className="dark-icon-btn"
              title="Adicionar pessoa"
              style={{ width: 'auto', padding: '0.25rem 0.625rem', gap: '0.25rem', display: 'inline-flex', alignItems: 'center', fontSize: '0.75rem', fontWeight: 500, color: 'rgba(255,255,255,0.5)' }}
            >
              <Plus style={{ width: '0.875rem', height: '0.875rem' }} />
              Pessoa
            </button>
            <button
              onClick={() => setConfirmRemoveOpen(true)}
              className="dark-icon-btn danger"
              title="Remover ministério"
              disabled={removeMinistry.isPending}
            >
              <X style={{ width: '0.875rem', height: '0.875rem' }} />
            </button>
          </>
        )}
      </div>

      {/* Members */}
      {expanded && (
        <div>
          {isLoading ? (
            <div style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.35)' }}>
              A carregar…
            </div>
          ) : schedules.length === 0 ? (
            <div style={{ padding: '0.875rem 1rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.35)' }}>
              Nenhuma pessoa escalada.{' '}
              {isAdmin && <button
                onClick={() => setAddPersonOpen(true)}
                style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', fontSize: 'inherit' }}
              >
                Adicionar
              </button>}
            </div>
          ) : (
            schedules.map((schedule, idx) => {
              const name = schedule.profile?.full_name ?? schedule.user_id;
              const isLast = idx === schedules.length - 1;
              return (
                <div key={schedule.id} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.05)',
                  transition: 'background 0.12s',
                }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="text-xs" style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}>
                      {getInitials(name)}
                    </AvatarFallback>
                  </Avatar>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {name}
                    </p>
                    {schedule.functions.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginTop: '0.25rem' }}>
                        {schedule.functions.map((fn) => (
                          <span key={fn} style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.38)' }}>
                            {getFunctionEmoji(fn)} {getFunctionLabel(fn)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Confirm status */}
                  <button
                    onClick={() => handleConfirm(schedule, !schedule.confirmed)}
                    title={schedule.confirmed === true ? 'Confirmado' : schedule.confirmed === false ? 'Recusou' : 'Pendente'}
                    style={{
                      width: '1.75rem', height: '1.75rem', borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: 'none', cursor: 'pointer', flexShrink: 0,
                      background: schedule.confirmed === true
                        ? 'rgba(110,231,183,0.18)'
                        : schedule.confirmed === false
                        ? 'rgba(239,68,68,0.18)'
                        : 'rgba(255,255,255,0.07)',
                      color: schedule.confirmed === true
                        ? '#6ee7b7'
                        : schedule.confirmed === false
                        ? '#f87171'
                        : 'rgba(255,255,255,0.3)',
                      transition: 'background 0.12s',
                    }}
                  >
                    <Check style={{ width: '0.75rem', height: '0.75rem' }} />
                  </button>

                  {isAdmin && (
                    <>
                      <button className="dark-icon-btn" onClick={() => setEditTarget(schedule)} title="Editar">
                        <Pencil style={{ width: '0.75rem', height: '0.75rem' }} />
                      </button>
                      <button className="dark-icon-btn danger" onClick={() => handleRemovePerson(schedule)} title="Remover">
                        <X style={{ width: '0.75rem', height: '0.75rem' }} />
                      </button>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      <PersonDialog open={addPersonOpen} onOpenChange={setAddPersonOpen} mode="add"
        eventMinistryId={em.id} ministryId={em.ministry_id} assignedUserIds={assignedUserIds} />

      <PersonDialog open={!!editTarget} onOpenChange={(v) => { if (!v) setEditTarget(null); }}
        mode="edit" eventMinistryId={em.id} ministryId={em.ministry_id}
        assignedUserIds={assignedUserIds} editTarget={editTarget} />

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
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleRemoveMinistry} disabled={removeMinistry.isPending}>
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
  const { activeMembership } = useOrgStore();
  const isAdmin = activeMembership?.role === 'admin';
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [addMinistryOpen, setAddMinistryOpen] = useState(false);
  const [mobileShowDetail, setMobileShowDetail] = useState(false);

  function handleSelectEvent(id: string) {
    setSelectedEventId(id);
    setMobileShowDetail(true);
  }

  function handleMobileBack() {
    setMobileShowDetail(false);
  }

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
      const result = await notifySchedules.mutateAsync({ eventId: selectedEvent.id, eventName: selectedEvent.name });
      if (result.notified === 0) {
        toast.info('Escala publicada. Ainda não há pessoas escaladas para notificar.');
      } else {
        toast.success(`Escala publicada e ${result.notified} ${result.notified === 1 ? 'pessoa notificada' : 'pessoas notificadas'}.`);
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao publicar escala');
    }
  }

  const sortedEvents = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const existingMinistryIds = eventMinistries.map((em) => em.ministry_id);

  return (
    <div style={{
      display: 'flex', height: '100%', minHeight: 0, overflow: 'hidden',
      position: 'relative', background: '#000000', color: '#ffffff',
    }}>
      {/* Spotlight */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: `
          radial-gradient(ellipse 65% 55% at 80% -5%, rgba(210,210,235,0.10) 0%, transparent 65%),
          radial-gradient(ellipse 35% 40% at 78% -2%, rgba(255,255,255,0.06) 0%, transparent 50%)
        `,
      }} />

      {/* ── Left: event list ──────────────────────────── */}
      <aside className={`schedule-aside scrollbar-none${mobileShowDetail ? ' mobile-hidden' : ''}`}>
        {/* Header */}
        <div style={{ padding: '1.25rem 1rem 0.75rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>
            Escalas
          </p>
        </div>

        {eventsLoading ? (
          <div style={{ padding: '1rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.3)' }}>
            A carregar…
          </div>
        ) : sortedEvents.length === 0 ? (
          <div style={{ padding: '1rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.3)' }}>
            Sem eventos criados
          </div>
        ) : (
          <ul style={{ padding: '0.375rem 0.5rem', margin: 0, listStyle: 'none' }}>
            {sortedEvents.map((event) => {
              const isSelected = selectedEventId === event.id;
              return (
                <li key={event.id}>
                  <button
                    onClick={() => handleSelectEvent(event.id)}
                    style={{
                      width: '100%', textAlign: 'left', padding: '0.625rem 0.625rem',
                      borderRadius: '0.5rem', border: 'none', cursor: 'pointer',
                      background: isSelected ? 'rgba(255,255,255,0.1)' : 'transparent',
                      color: isSelected ? '#ffffff' : 'rgba(255,255,255,0.5)',
                      transition: 'background 0.12s, color 0.12s',
                      position: 'relative',
                      display: 'block',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
                        (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.8)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                        (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.5)';
                      }
                    }}
                  >
                    {isSelected && (
                      <div style={{
                        position: 'absolute', left: 0, top: '18%', height: '64%',
                        width: '2.5px', borderRadius: '0 2px 2px 0',
                        background: 'rgba(255,255,255,0.75)',
                      }} />
                    )}
                    <p style={{ fontSize: '0.825rem', fontWeight: isSelected ? 600 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {event.name}
                    </p>
                    <p style={{ fontSize: '0.7rem', marginTop: '0.2rem', color: 'rgba(255,255,255,0.3)' }}>
                      {formatDate(event.date)}{event.time ? ` · ${event.time.slice(0, 5)}` : ''}
                    </p>
                    {event.location && (
                      <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.25)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {event.location}
                      </p>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </aside>

      {/* ── Right: event detail ───────────────────────── */}
      <main className={`schedule-main scrollbar-none${!mobileShowDetail ? ' mobile-hidden' : ''}`}>
        {!selectedEvent ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <div style={{ textAlign: 'center' }}>
              <CalendarDays style={{ width: '2.5rem', height: '2.5rem', margin: '0 auto 0.75rem', color: 'rgba(255,255,255,0.15)' }} />
              <p style={{ fontSize: '1rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>
                Seleciona um evento
              </p>
              <p style={{ fontSize: '0.875rem', marginTop: '0.25rem', color: 'rgba(255,255,255,0.25)' }}>
                Escolhe um evento na lista à esquerda
              </p>
            </div>
          </div>
        ) : (
          <div className="schedule-detail-pad" style={{ padding: '1.5rem 2rem', maxWidth: '56rem' }}>

            {/* Mobile back button */}
            <button
              onClick={handleMobileBack}
              style={{
                display: 'none',
                alignItems: 'center', gap: '0.375rem',
                marginBottom: '1rem',
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '0.8rem', fontWeight: 600,
                color: 'rgba(255,255,255,0.5)',
                padding: '0.25rem 0',
              }}
              className="schedule-back-btn"
            >
              <ArrowLeft style={{ width: '1rem', height: '1rem' }} />
              Escalas
            </button>

            {/* Event header */}
            <div className="schedule-event-header" style={{
              display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem',
              paddingBottom: '1.25rem', marginBottom: '1.5rem',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: '0.25rem' }}>
                  Escala
                </p>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff', lineHeight: 1.1 }}>
                  {selectedEvent.name}
                </h1>
                <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.38)', marginTop: '0.375rem' }}>
                  {formatDate(selectedEvent.date)}
                  {selectedEvent.time && ` · ${selectedEvent.time.slice(0, 5)}`}
                  {selectedEvent.location && ` · ${selectedEvent.location}`}
                </p>
              </div>

              <div className="schedule-event-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <DarkBadge color={selectedEvent.is_published ? '#6ee7b7' : undefined}>
                  {selectedEvent.is_published ? 'Publicado' : 'Rascunho'}
                </DarkBadge>

                {isAdmin && (
                  <button
                    onClick={handlePublishAndNotify}
                    disabled={publishEvent.isPending || notifySchedules.isPending}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                      padding: '0.4rem 0.875rem',
                      background: 'rgba(255,255,255,0.07)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '0.5rem',
                      fontSize: '0.8rem', fontWeight: 500, color: 'rgba(255,255,255,0.75)',
                      cursor: 'pointer', transition: 'background 0.12s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
                  >
                    <Send style={{ width: '0.875rem', height: '0.875rem' }} />
                    {publishEvent.isPending || notifySchedules.isPending
                      ? 'A publicar…'
                      : selectedEvent.is_published ? 'Notificar escala' : 'Publicar e notificar'}
                  </button>
                )}

                {isAdmin && (
                  <button
                    onClick={() => setAddMinistryOpen(true)}
                    className="dark-primary-btn"
                    style={{ padding: '0.4rem 0.875rem', fontSize: '0.8rem' }}
                  >
                    <Plus style={{ width: '0.875rem', height: '0.875rem' }} />
                    Ministério
                  </button>
                )}
              </div>
            </div>

            {/* Ministry slots */}
            {emLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} style={{ height: '5rem', borderRadius: '0.875rem', background: 'rgba(255,255,255,0.05)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                ))}
              </div>
            ) : eventMinistries.length === 0 ? (
              <div className="events-dark-empty">
                <Users style={{ width: '2.5rem', height: '2.5rem', margin: '0 auto 0.75rem', color: 'rgba(255,255,255,0.2)' }} />
                <p style={{ fontSize: '0.9rem', fontWeight: 500, color: 'rgba(255,255,255,0.4)' }}>
                  Nenhum ministério neste evento
                </p>
                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.25)', marginTop: '0.25rem', marginBottom: '1rem' }}>
                  Adiciona ministérios para começar a escalar pessoas
                </p>
                {isAdmin && (
                  <button onClick={() => setAddMinistryOpen(true)} className="dark-primary-btn">
                    <Plus style={{ width: '0.875rem', height: '0.875rem' }} />
                    Adicionar Ministério
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {(eventMinistries as (EventMinistry & { ministry: Ministry })[]).map((em) => (
                  <MinistrySlot key={em.id} em={em} eventId={selectedEvent.id} isAdmin={isAdmin} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

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
