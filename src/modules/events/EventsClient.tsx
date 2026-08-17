'use client';

import { useState, useMemo, useEffect } from 'react';

import { Plus, Pencil, Trash2, MapPin, Clock, Search, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import { useEvents, useDeleteEvent } from '@/hooks/useEvents';
import { useOrgStore } from '@/stores/orgStore';
import type { Event } from '@/types/models';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { formatTime, eventPeriod } from '@/lib/utils';
import { EventCreatePanel } from './EventCreatePanel';
import { EventDetailPanel } from './EventDetailPanel';
import { EventEditPanel } from './EventEditPanel';

interface Props { orgId: string }

type StatusFilter = 'all' | 'upcoming' | 'past' | 'published' | 'draft';

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all',       label: 'Todos' },
  { value: 'upcoming',  label: 'Próximos' },
  { value: 'past',      label: 'Passados' },
  { value: 'published', label: 'Publicados' },
  { value: 'draft',     label: 'Rascunhos' },
];


function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dayMonth(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return {
    day: String(d.getDate()).padStart(2, '0'),
    month: d.toLocaleString('pt-PT', { month: 'short' }).replace('.', '').toUpperCase(),
  };
}

/** Agrupa por mês para a timeline — o cabeçalho dá o contexto que o dia sozinho não dá. */
function groupByMonth<T extends { date: string }>(events: T[]): { label: string; events: T[] }[] {
  const groups: { label: string; events: T[] }[] = [];
  for (const ev of events) {
    const d = new Date(ev.date + 'T00:00:00');
    const label = d.toLocaleString('pt-PT', { month: 'long', year: 'numeric' });
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.events.push(ev);
    else groups.push({ label, events: [ev] });
  }
  return groups;
}

export function EventsClient({ orgId: _orgId }: Props) {
  const { data: events = [], isLoading } = useEvents();
  const deleteEvent = useDeleteEvent();
  const { activeMembership } = useOrgStore();
  const role = activeMembership?.role;
  const isAdmin = role === 'admin';
  const canManage = role === 'admin' || role === 'leader'; // criar/editar

  const [createMode, setCreateMode] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Event | null>(null);
  const [detailEvent, setDetailEvent] = useState<Event | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('upcoming');
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Abre automaticamente o evento vindo da Dashboard ou de uma notificação (?event=<id>).
  useEffect(() => {
    const eventParam = new URLSearchParams(window.location.search).get('event');
    if (!eventParam) return;
    const found = events.find((e) => e.id === eventParam);
    if (found) setDetailEvent(found);
  }, [events]);

  function handleNew() { setCreateMode(true); }
  function handleEdit(_e: Event) { setEditMode(true); }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteEvent.mutateAsync(deleteTarget.id);
      toast.success('Evento removido');
      setDeleteTarget(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao remover');
    }
  }

  const filtered = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const q = search.trim().toLowerCase();
    return events.filter((event) => {
      if (q) {
        const ok = event.name.toLowerCase().includes(q) ||
          (event.location?.toLowerCase().includes(q) ?? false);
        if (!ok) return false;
      }
      switch (statusFilter) {
        case 'upcoming':  return event.date >= today;
        case 'past':      return event.date < today;
        case 'published': return event.is_published;
        case 'draft':     return !event.is_published;
        default:          return true;
      }
    });
  }, [events, search, statusFilter]);

  const sorted = [...filtered].sort((a, b) => a.date.localeCompare(b.date));

  /* ── Create panel ────────────────────────────────────────────────────── */
  if (createMode) {
    return <EventCreatePanel onBack={() => setCreateMode(false)} />;
  }

  /* ── Edit panel ──────────────────────────────────────────────────────── */
  if (detailEvent && editMode) {
    return (
      <EventEditPanel
        event={detailEvent}
        onBack={() => setEditMode(false)}
      />
    );
  }

  /* ── Detail panel ─────────────────────────────────────────────────────── */
  if (detailEvent) {
    return (
        <EventDetailPanel
          event={detailEvent}
          onBack={() => setDetailEvent(null)}
          isAdmin={isAdmin}
          canManage={canManage}
          onEdit={() => handleEdit(detailEvent)}
        />
    );
  }

  /* ── List ──────────────────────────────────────────────────────────────── */
  return (
    <div className="dash-purple-bg">
      <div className="p-5 md:p-8 space-y-6">

        {/* ── Header ────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 pt-2">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] uppercase text-[color:var(--wis-text-3)]">
              Gestão
            </p>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[color:var(--wis-text)] mt-1">
              Eventos
            </h1>
            <p className="text-[color:var(--wis-text-3)] text-sm mt-0.5">
              Gere os eventos da organização
            </p>
          </div>
          {canManage && (
            <button onClick={handleNew} className="dark-primary-btn">
              <Plus className="h-4 w-4" />
              Novo Evento
            </button>
          )}
        </div>

        {/* ── Filters ───────────────────────────────────── */}
        <div className="dark-inputs flex flex-col gap-2.5 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--wis-text-3)' }} />
            <Input
              placeholder="Pesquisar por nome ou local…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ── List ──────────────────────────────────────── */}
        {isLoading ? (
          <div className="space-y-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl"
                style={{ background: 'var(--wis-surface-2)' }} />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="events-dark-empty">
            <CalendarDays className="h-10 w-10 mb-3" style={{ color: 'var(--wis-text-4)' }} />
            <p className="text-sm" style={{ color: 'var(--wis-text-3)' }}>
              {search
                ? 'Nenhum evento encontrado.'
                : statusFilter === 'upcoming'
                ? 'Não há eventos próximos.'
                : statusFilter === 'past'
                ? 'Não há eventos passados.'
                : 'Nenhum evento criado ainda.'}
            </p>
            {canManage && !search && (
              <button onClick={handleNew} className="dark-primary-btn mt-4">
                <Plus className="h-4 w-4" /> Criar primeiro evento
              </button>
            )}
          </div>
        ) : (
          <div className="wis-timeline">
            {groupByMonth(sorted).map(({ label, events }) => (
              <div key={label}>
                <p className="wis-tl-month">{label}</p>
                {events.map((event) => {
                  const { day, month } = dayMonth(event.date);
                  const period = eventPeriod(event.time);
                  const isUpcoming = event.date >= todayISO();
                  return (
                    <div
                      key={event.id}
                      className={`wis-tl-item${isUpcoming ? ' is-next' : ''}`}
                      onClick={() => setDetailEvent(event)}
                    >
                      <span className="wis-tl-date" aria-hidden>
                        <b>{day}</b><span>{month}</span>
                      </span>
                      <span className="wis-tl-dot" aria-hidden />

                      {event.cover_image_url && (
                        <span
                          className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0"
                          onClick={(e) => { e.stopPropagation(); setLightboxUrl(event.cover_image_url!); }}
                          style={{ cursor: 'zoom-in' }}
                        >
                          <img src={event.cover_image_url} alt="" className="w-full h-full object-cover" />
                        </span>
                      )}

                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.98rem', fontWeight: 600, color: 'var(--wis-text)' }}>
                            {event.name}
                          </span>
                          {!event.is_published && <span className="wis-pill">Rascunho</span>}
                          {period && <span className="wis-pill wis-pill-accent">{period.label}</span>}
                        </span>
                        <span style={{
                          display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap',
                          fontSize: '0.8rem', color: 'var(--wis-text-3)', marginTop: '0.2rem',
                        }}>
                          {event.time && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Clock className="h-3 w-3" />{formatTime(event.time)}
                            </span>
                          )}
                          {event.location && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', minWidth: 0 }}>
                              <MapPin className="h-3 w-3 flex-shrink-0" />
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {event.location}
                              </span>
                            </span>
                          )}
                        </span>
                      </span>

                      {canManage && (
                        <span className="flex gap-0.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button className="dark-icon-btn" onClick={() => handleEdit(event)} aria-label={`Editar ${event.name}`}>
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          {isAdmin && (
                            <button className="dark-icon-btn danger" onClick={() => setDeleteTarget(event)} aria-label={`Remover ${event.name}`}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

      </div>

      {/* ── Dialogs ───────────────────────────────────── */}
      <Dialog open={!!lightboxUrl} onOpenChange={(v) => { if (!v) setLightboxUrl(null); }}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black border-0 [&>button]:hidden">
          {lightboxUrl && (
            <img
              src={lightboxUrl}
              alt="Imagem do evento"
              className="w-full h-auto max-h-[85vh] object-contain"
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover evento?</AlertDialogTitle>
            <AlertDialogDescription>
              Tens a certeza que queres remover <strong>{deleteTarget?.name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
              disabled={deleteEvent.isPending}
            >
              {deleteEvent.isPending ? 'A remover…' : 'Remover'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
