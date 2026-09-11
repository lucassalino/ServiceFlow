'use client';

import { useState, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Plus, X, Check, Users, ChevronDown, ChevronRight,
  Pencil, CalendarDays, ArrowLeft, Clock, MapPin, Minus, CalendarOff, AlertTriangle, UserCheck,
} from 'lucide-react';
import { useEvents } from '@/hooks/useEvents';
import { useOrgStore } from '@/stores/orgStore';
import { useMinistries } from '@/hooks/useMinistries';
import { useMinistryMembers } from '@/hooks/useMembers';
import { useOrgUnavailability } from '@/hooks/useAvailability';
import { findConflictingUnavailability, describeUnavailability } from '@/lib/availability';
import {
  useEventMinistries,
  useEventSchedules,
  useAddMinistryToEvent,
  useRemoveMinistryFromEvent,
  useAddPersonToSchedule,
  useRemovePersonFromSchedule,
  useConfirmSchedule,
  useCheckInSchedule,
  useEventAssignments,
  useUpdateEventSchedule,
} from '@/hooks/useSchedule';
import { resolveFunction, getFunctionLabel } from '@/lib/constants';
import { formatDate, formatTime, getInitials } from '@/lib/utils';
import { ConfirmAttendanceDialog } from '@/components/ConfirmAttendanceDialog';
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

import { EventActivityTab } from '@/modules/events/EventDetailPanel';

// ── Shared dark badge ────────────────────────────────────────────────────────

function DarkBadge({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
      fontSize: '0.7rem', fontWeight: 600, padding: '0.15rem 0.5rem',
      borderRadius: '9999px', letterSpacing: '0.04em',
      background: color ? `color-mix(in srgb, ${color} 13%, transparent)` : 'var(--wis-surface-3)',
      color: color ?? 'var(--wis-text-2)',
      border: `1px solid ${color ? `color-mix(in srgb, ${color} 27%, transparent)` : 'var(--wis-border-strong)'}`,
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
  open, onOpenChange, mode, eventId, eventMinistryId, ministryId, assignedUserIds, editTarget, eventDate, eventTime,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: 'add' | 'edit';
  eventId: string;
  eventMinistryId: string;
  ministryId: string;
  assignedUserIds: string[];
  editTarget?: EventSchedule | null;
  eventDate: string;
  eventTime: string;
}) {
  const { data: ministryMembers = [] } = useMinistryMembers(ministryId);
  const { data: unavailabilityByUser } = useOrgUnavailability();
  const { data: assignments = [] } = useEventAssignments(eventId);
  const addPerson = useAddPersonToSchedule();
  const updateSchedule = useUpdateEventSchedule();

  // Ministérios (deste evento) onde a pessoa já está escalada, fora deste ministério.
  function conflictMinistries(userId: string): string[] {
    return [...new Set(
      assignments.filter((a) => a.userId === userId && a.ministryId !== ministryId).map((a) => a.ministryName),
    )];
  }

  const typedMinistryMembers = ministryMembers as unknown as MinistryMember[];

  const [selectedUserId, setSelectedUserId] = useState<string | null>(
    mode === 'edit' && editTarget ? editTarget.user_id : null,
  );
  const [selectedFunctions, setSelectedFunctions] = useState<string[]>(
    mode === 'edit' && editTarget ? editTarget.functions : [],
  );

  // Só os membros deste ministério podem ser escalados
  const available = mode === 'add'
    ? typedMinistryMembers.filter((m) => m.is_active && !assignedUserIds.includes(m.user_id))
    : [];

  // Só as funções que a pessoa selecionada tem neste ministério
  const personFunctions = useMemo(() => {
    const keys = new Set<string>();
    const mm = typedMinistryMembers.find((m) => m.user_id === selectedUserId);
    (mm?.functions ?? []).forEach((k) => keys.add(k));
    // Em edição, manter também funções já atribuídas nesta escala
    if (mode === 'edit' && editTarget) editTarget.functions.forEach((k) => keys.add(k));
    return Array.from(keys).map((k) => resolveFunction(k));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ministryMembers, selectedUserId, mode, editTarget]);

  function handleSelectPerson(userId: string) {
    setSelectedUserId(userId);
    const mm = typedMinistryMembers.find((m) => m.user_id === userId);
    setSelectedFunctions(mm?.functions ?? []);
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
                    const conflict = findConflictingUnavailability(unavailabilityByUser?.[m.user_id], eventDate, eventTime);
                    const scheduleConflicts = conflictMinistries(m.user_id);
                    return (
                      <button key={m.user_id} onClick={() => handleSelectPerson(m.user_id)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-accent transition-colors text-left ${selectedUserId === m.user_id ? 'bg-accent' : ''}`}>
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-[10px]">{getInitials(name)}</AvatarFallback>
                        </Avatar>
                        <span className="flex-1">{name}</span>
                        {scheduleConflicts.length > 0 && (
                          <span title={`Já escalado em: ${scheduleConflicts.join(', ')}`} className="shrink-0">
                            <AlertTriangle className="h-3.5 w-3.5" style={{ color: 'var(--wis-warning)' }} />
                          </span>
                        )}
                        {conflict && (
                          <span title={describeUnavailability(conflict)} className="shrink-0">
                            <CalendarOff className="h-3.5 w-3.5" style={{ color: 'var(--wis-danger)' }} />
                          </span>
                        )}
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
          {selectedUserId && conflictMinistries(selectedUserId).length > 0 && (
            <div className="flex items-start gap-2 rounded-md p-2.5 text-xs"
              style={{ background: 'var(--wis-warning-bg)', border: '1px solid #f3ddb6', color: 'var(--wis-warning)' }}>
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>Esta pessoa já está escalada em <strong>{conflictMinistries(selectedUserId).join(', ')}</strong> neste mesmo evento.</span>
            </div>
          )}
          <div>
            <p className="text-sm font-medium mb-2">Funções</p>
            {mode === 'add' && !selectedUserId ? (
              <p className="text-xs text-muted-foreground">Seleciona uma pessoa primeiro</p>
            ) : personFunctions.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Esta pessoa não tem funções definidas neste ministério.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-1">
                {personFunctions.map((f) => (
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

function MinistrySlot({ em, eventId, isAdmin, eventName, eventDate, eventTime }: {
  em: EventMinistry & { ministry: Ministry }; eventId: string; isAdmin: boolean;
  eventName: string; eventDate: string; eventTime: string;
}) {
  const [expanded, setExpanded] = useState(true);
  const [addPersonOpen, setAddPersonOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<EventSchedule | null>(null);
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);
  const [attendanceTarget, setAttendanceTarget] = useState<EventSchedule | null>(null);

  const { data: schedules = [], isLoading } = useEventSchedules(em.id);
  const { data: unavailabilityByUser } = useOrgUnavailability();
  const { data: assignments = [] } = useEventAssignments(eventId);
  const removeMinistry = useRemoveMinistryFromEvent();
  const removePerson = useRemovePersonFromSchedule();
  const confirmSchedule = useConfirmSchedule();
  const checkInSchedule = useCheckInSchedule();
  const { activeMembership } = useOrgStore();
  const currentUserId = activeMembership?.user_id;

  function scheduleConflicts(userId: string): string[] {
    return [...new Set(
      assignments.filter((a) => a.userId === userId && a.ministryId !== em.ministry_id).map((a) => a.ministryName),
    )];
  }

  async function handleCheckIn(schedule: EventSchedule, checkedIn: boolean) {
    try {
      await checkInSchedule.mutateAsync({ id: schedule.id, eventMinistryId: em.id, checkedIn });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro');
    }
  }

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
    if (schedule.user_id !== currentUserId) return;
    try {
      await confirmSchedule.mutateAsync({ id: schedule.id, eventMinistryId: em.id, confirmed });
      setAttendanceTarget(null);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro');
    }
  }

  const assignedUserIds = schedules.map((s) => s.user_id);
  const color = em.ministry.color;

  return (
    <div style={{ borderTop: '1px solid var(--wis-border)' }}>
      {/* Header do ministério — risca de cor + nome, sem moldura */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.6rem',
        padding: '0.9rem 0 0.7rem',
      }}>
        {/* Risca da cor do ministério */}
        <div style={{ width: 3, height: '1.1rem', borderRadius: 9999, background: color, flexShrink: 0 }} />

        <button
          onClick={() => setExpanded((v) => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--wis-text)' }}
        >
          {expanded
            ? <ChevronDown style={{ width: '1rem', height: '1rem', color: 'var(--wis-text-3)', flexShrink: 0 }} />
            : <ChevronRight style={{ width: '1rem', height: '1rem', color: 'var(--wis-text-3)', flexShrink: 0 }} />}
          <span style={{
            fontWeight: 600, fontSize: '0.78rem', letterSpacing: '0.08em',
            textTransform: 'uppercase', color: 'var(--wis-text-2)',
          }}>
            {em.ministry.name}
          </span>
          <DarkBadge color={color}>
            <Users style={{ width: '0.65rem', height: '0.65rem' }} />
            {schedules.length}
          </DarkBadge>
        </button>

        {/* Actions — admin only */}
        {isAdmin && (
          <button
            onClick={() => setConfirmRemoveOpen(true)}
            className="dark-icon-btn danger"
            title="Remover ministério"
            disabled={removeMinistry.isPending}
          >
            <X style={{ width: '0.875rem', height: '0.875rem' }} />
          </button>
        )}
      </div>

      {/* Members */}
      {expanded && (
        <div>
          {isLoading ? (
            <div style={{ padding: '0.5rem 0 0.9rem 0.9rem', fontSize: '0.875rem', color: 'var(--wis-text-3)' }}>
              A carregar…
            </div>
          ) : schedules.length === 0 ? (
            <div style={{ padding: '0.5rem 0 0.9rem 0.9rem', fontSize: '0.875rem', color: 'var(--wis-text-3)' }}>
              Nenhuma pessoa escalada.
            </div>
          ) : (
            schedules.map((schedule, idx) => {
              const name = schedule.profile?.full_name ?? schedule.user_id;
              const isLast = idx === schedules.length - 1;
              const conflict = findConflictingUnavailability(unavailabilityByUser?.[schedule.user_id], eventDate, eventTime);
              const otherMinistries = scheduleConflicts(schedule.user_id);
              return (
                <div key={schedule.id} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.65rem 0.5rem 0.65rem 0.9rem',
                  borderRadius: 'var(--wis-radius-sm)',
                  marginBottom: isLast ? '0.35rem' : 0,
                  transition: 'background 0.12s',
                }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--wis-surface-2)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="text-xs" style={{ background: 'var(--wis-surface-4)', color: 'var(--wis-text)' }}>
                      {getInitials(name)}
                    </AvatarFallback>
                  </Avatar>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--wis-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      {name}
                      {otherMinistries.length > 0 && (
                        <span title={`Também escalado em: ${otherMinistries.join(', ')}`} style={{ display: 'inline-flex', flexShrink: 0 }}>
                          <AlertTriangle style={{ width: '0.75rem', height: '0.75rem', color: 'var(--wis-warning)' }} />
                        </span>
                      )}
                      {conflict && (
                        <span title={describeUnavailability(conflict)} style={{ display: 'inline-flex', flexShrink: 0 }}>
                          <CalendarOff style={{ width: '0.75rem', height: '0.75rem', color: 'var(--wis-danger)' }} />
                        </span>
                      )}
                    </p>
                    {schedule.functions.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginTop: '0.25rem' }}>
                        {schedule.functions.map((fn) => (
                          <span key={fn} className="wis-pill">{getFunctionLabel(fn)}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Confirm status — só a própria pessoa pode alterar */}
                  {(() => {
                    const isMe = schedule.user_id === currentUserId;
                    const circleStyle: React.CSSProperties = {
                      width: '1.75rem', height: '1.75rem', borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: 'none', flexShrink: 0,
                      background: schedule.confirmed === true
                        ? 'var(--wis-success-bg)'
                        : schedule.confirmed === false
                        ? 'var(--wis-danger-bg)'
                        : 'var(--wis-surface-3)',
                      color: schedule.confirmed === true
                        ? 'var(--wis-success)'
                        : schedule.confirmed === false
                        ? 'var(--wis-danger)'
                        : 'var(--wis-text-3)',
                      transition: 'background 0.12s',
                    };
                    const icon = schedule.confirmed === true
                      ? <Check style={{ width: '0.75rem', height: '0.75rem' }} />
                      : schedule.confirmed === false
                      ? <X style={{ width: '0.75rem', height: '0.75rem' }} />
                      : <Minus style={{ width: '0.75rem', height: '0.75rem' }} />;
                    const title = schedule.confirmed === true ? 'Confirmado' : schedule.confirmed === false ? 'Recusou' : 'Pendente';

                    if (!isMe) {
                      return <div title={title} style={circleStyle}>{icon}</div>;
                    }
                    return (
                      <button
                        onClick={() => setAttendanceTarget(schedule)}
                        title="Confirmar ou declinar presença"
                        style={{ ...circleStyle, cursor: 'pointer' }}
                      >
                        {icon}
                      </button>
                    );
                  })()}

                  {/* Check-in de presença — visível para admin/líder, marcado no dia do evento */}
                  {isAdmin && (
                    <button
                      onClick={() => handleCheckIn(schedule, !schedule.checked_in_at)}
                      disabled={checkInSchedule.isPending}
                      title={schedule.checked_in_at ? 'Presente — clique para desmarcar' : 'Marcar presença (check-in)'}
                      style={{
                        width: '1.75rem', height: '1.75rem', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: 'none', flexShrink: 0, cursor: 'pointer',
                        background: schedule.checked_in_at ? 'var(--wis-blue-soft)' : 'var(--wis-surface-3)',
                        color: schedule.checked_in_at ? 'var(--wis-blue)' : 'var(--wis-text-3)',
                        transition: 'background 0.12s',
                      }}
                    >
                      <UserCheck style={{ width: '0.85rem', height: '0.85rem' }} />
                    </button>
                  )}

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

      <ConfirmAttendanceDialog
        open={attendanceTarget !== null}
        onOpenChange={(o) => { if (!o) setAttendanceTarget(null); }}
        eventName={eventName}
        eventSubtitle={`${formatDate(eventDate)} · ${formatTime(eventTime)}`}
        currentStatus={attendanceTarget?.confirmed ?? null}
        isPending={confirmSchedule.isPending}
        onConfirm={() => attendanceTarget && handleConfirm(attendanceTarget, true)}
        onDecline={() => attendanceTarget && handleConfirm(attendanceTarget, false)}
      />

      <PersonDialog open={addPersonOpen} onOpenChange={setAddPersonOpen} mode="add"
        eventId={eventId} eventMinistryId={em.id} ministryId={em.ministry_id} assignedUserIds={assignedUserIds}
        eventDate={eventDate} eventTime={eventTime} />

      <PersonDialog open={!!editTarget} onOpenChange={(v) => { if (!v) setEditTarget(null); }}
        mode="edit" eventId={eventId} eventMinistryId={em.id} ministryId={em.ministry_id}
        assignedUserIds={assignedUserIds} editTarget={editTarget}
        eventDate={eventDate} eventTime={eventTime} />

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
  // Admins e líderes gerem escalas (criar/editar). RLS permite ambos.
  const isAdmin = activeMembership?.role === 'admin' || activeMembership?.role === 'leader';
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [addMinistryOpen, setAddMinistryOpen] = useState(false);
  const [mobileShowDetail, setMobileShowDetail] = useState(false);

  // Abre automaticamente o evento vindo de uma notificação (?event=<id>).
  useEffect(() => {
    const eventParam = new URLSearchParams(window.location.search).get('event');
    if (eventParam && events.some((e) => e.id === eventParam)) {
      setSelectedEventId(eventParam);
      setMobileShowDetail(true);
    }
  }, [events]);

  function handleSelectEvent(id: string) {
    setSelectedEventId(id);
    setMobileShowDetail(true);
  }

  function handleMobileBack() {
    setMobileShowDetail(false);
  }

  const { data: eventMinistries = [], isLoading: emLoading } = useEventMinistries(selectedEventId);

  const selectedEvent = events.find((e) => e.id === selectedEventId) ?? null;

  // Nas escalas só aparecem os próximos eventos — nunca os já passados.
  const today = new Date().toISOString().split('T')[0];
  const sortedEvents = [...events]
    .filter((e) => e.date >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const existingMinistryIds = eventMinistries.map((em) => em.ministry_id);

  return (
    <div style={{
      display: 'flex', height: '100%', minHeight: 0, overflow: 'hidden',
      position: 'relative', background: 'var(--wis-canvas)', color: 'var(--wis-text)',
    }}>
      {/* Spotlight */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: `
          radial-gradient(ellipse 65% 55% at 80% -5%, rgba(210,210,235,0.10) 0%, transparent 65%),
          radial-gradient(ellipse 35% 40% at 78% -2%, var(--wis-surface-3) 0%, transparent 50%)
        `,
      }} />

      {/* ── Left: event list ──────────────────────────── */}
      <aside className={`schedule-aside scrollbar-none${mobileShowDetail ? ' mobile-hidden' : ''}`}>
        {/* Header */}
        <div style={{ padding: '1.5rem 1.1rem 1rem', borderBottom: '1px solid var(--wis-border)' }}>
          <p className="wis-eyebrow">Agenda</p>
          <h1 className="wis-title" style={{ fontSize: '1.75rem', marginTop: '0.35rem' }}>Escalas</h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--wis-text-2)', margin: '0.45rem 0 0' }}>
            {sortedEvents.length === 0
              ? 'Sem eventos para escalar'
              : `${sortedEvents.length} evento${sortedEvents.length !== 1 ? 's' : ''} · escolhe um para ver quem serve`}
          </p>
        </div>

        {eventsLoading ? (
          <div style={{ padding: '0.75rem 0.625rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ height: '4.5rem', borderRadius: '0.625rem', background: 'var(--wis-surface-2)', animation: 'pulse 1.5s ease-in-out infinite' }} />
            ))}
          </div>
        ) : sortedEvents.length === 0 ? (
          <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
            <CalendarDays style={{ width: '1.75rem', height: '1.75rem', color: 'var(--wis-text-4)', margin: '0 auto 0.5rem' }} />
            <p style={{ fontSize: '0.8rem', color: 'var(--wis-text-3)', margin: 0 }}>Sem eventos</p>
          </div>
        ) : (
          <ul style={{ padding: '0.625rem 0.5rem', margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            {sortedEvents.map((event) => {
              const isSelected = selectedEventId === event.id;
              return (
                <li key={event.id}>
                  <button
                    onClick={() => handleSelectEvent(event.id)}
                    style={{
                      width: '100%', textAlign: 'left', padding: '0.625rem 0.75rem',
                      borderRadius: 'var(--wis-radius-sm)', border: '1px solid transparent',
                      cursor: 'pointer',
                      background: isSelected ? 'var(--wis-blue-soft)' : 'transparent',
                      color: 'var(--wis-text)',
                      transition: 'background 0.12s, border-color 0.12s',
                      display: 'flex', flexDirection: 'column', gap: '0.25rem',
                      position: 'relative', overflow: 'hidden',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        (e.currentTarget as HTMLButtonElement).style.background = 'var(--wis-surface-2)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                      }
                    }}
                  >
                    {/* Selected left accent */}
                    {isSelected && (
                      <div style={{
                        position: 'absolute', left: 0, top: 0, bottom: 0,
                        width: '3px', borderRadius: '0 2px 2px 0',
                        background: 'var(--wis-blue)',
                      }} />
                    )}

                    {/* Name + status */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.375rem', paddingLeft: isSelected ? '0.25rem' : 0 }}>
                      <p style={{ fontSize: '0.92rem', fontWeight: 600, color: isSelected ? 'var(--wis-blue)' : 'var(--wis-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0, flex: 1, minWidth: 0 }}>
                        {event.name}
                      </p>
                      {!event.is_published && <span className="wis-pill">Rascunho</span>}
                    </div>

                    {/* Date + time */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingLeft: isSelected ? '0.25rem' : 0 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', color: 'var(--wis-text-3)' }}>
                        <CalendarDays style={{ width: '0.65rem', height: '0.65rem', flexShrink: 0 }} />
                        {formatDate(event.date)}
                      </span>
                      {event.time && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', color: 'var(--wis-text-3)' }}>
                          <Clock style={{ width: '0.6rem', height: '0.6rem', flexShrink: 0 }} />
                          {formatTime(event.time)}
                        </span>
                      )}
                    </div>

                    {/* Location */}
                    {event.location && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', paddingLeft: isSelected ? '0.25rem' : 0 }}>
                        <MapPin style={{ width: '0.6rem', height: '0.6rem', color: 'var(--wis-text-4)', flexShrink: 0 }} />
                        <p style={{ fontSize: '0.68rem', color: 'var(--wis-text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                          {event.location}
                        </p>
                      </div>
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
              <CalendarDays style={{ width: '2.5rem', height: '2.5rem', margin: '0 auto 0.75rem', color: 'var(--wis-text-4)' }} />
              <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--wis-text-2)' }}>
                Seleciona um evento
              </p>
              <p style={{ fontSize: '0.875rem', marginTop: '0.25rem', color: 'var(--wis-text-4)' }}>
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
                color: 'var(--wis-text-2)',
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
              borderBottom: '1px solid var(--wis-border)',
            }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--wis-text-3)', marginBottom: '0.25rem' }}>
                  Escala
                </p>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--wis-text)', lineHeight: 1.1 }}>
                  {selectedEvent.name}
                </h1>
                <p style={{ fontSize: '0.875rem', color: 'var(--wis-text-3)', marginTop: '0.375rem' }}>
                  {formatDate(selectedEvent.date)}
                  {selectedEvent.time && ` · ${selectedEvent.time.slice(0, 5)}`}
                  {selectedEvent.location && ` · ${selectedEvent.location}`}
                </p>
              </div>

              <div className="schedule-event-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <DarkBadge color={selectedEvent.is_published ? 'var(--wis-success-bg)' : undefined}>
                  {selectedEvent.is_published ? 'Publicado' : 'Rascunho'}
                </DarkBadge>
              </div>
            </div>

            {/* Ministry slots */}
            {emLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} style={{ height: '5rem', borderRadius: '0.875rem', background: 'var(--wis-surface-2)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                ))}
              </div>
            ) : eventMinistries.length === 0 ? (
              <div className="events-dark-empty">
                <Users style={{ width: '2.5rem', height: '2.5rem', margin: '0 auto 0.75rem', color: 'var(--wis-text-4)' }} />
                <p style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--wis-text-3)' }}>
                  Nenhum ministério neste evento
                </p>
                <p style={{ fontSize: '0.8rem', color: 'var(--wis-text-4)', marginTop: '0.25rem', marginBottom: '1rem' }}>
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
                  <MinistrySlot key={em.id} em={em} eventId={selectedEvent.id} isAdmin={isAdmin}
                    eventName={selectedEvent.name} eventDate={selectedEvent.date} eventTime={selectedEvent.time} />
                ))}
              </div>
            )}

            {/* Histórico de alterações — só admin/líder */}
            {isAdmin && (
              <div style={{ marginTop: '2rem' }}>
                <p className="wis-eyebrow" style={{ marginBottom: '1rem' }}>Histórico</p>
                <EventActivityTab eventId={selectedEvent.id} />
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
