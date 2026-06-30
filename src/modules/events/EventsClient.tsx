'use client';

import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, MapPin, Clock, Search, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import { useEvents, useDeleteEvent } from '@/hooks/useEvents';
import { useOrgStore } from '@/stores/orgStore';
import type { Event } from '@/types/models';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { formatDate, formatTime } from '@/lib/utils';
import { EventDialog } from './EventDialog';
import { EventDetailPanel } from './EventDetailPanel';

interface Props { orgId: string }

type StatusFilter = 'all' | 'upcoming' | 'past' | 'published' | 'draft';

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all',       label: 'Todos' },
  { value: 'upcoming',  label: 'Próximos' },
  { value: 'past',      label: 'Passados' },
  { value: 'published', label: 'Publicados' },
  { value: 'draft',     label: 'Rascunhos' },
];

function StatusBadge({ published }: { published: boolean }) {
  return published ? (
    <span style={{
      fontSize: '0.7rem', fontWeight: 600, padding: '0.15rem 0.5rem',
      borderRadius: '9999px', letterSpacing: '0.04em',
      background: 'rgba(110,231,183,0.15)', color: '#6ee7b7',
      border: '1px solid rgba(110,231,183,0.25)',
    }}>Publicado</span>
  ) : (
    <span style={{
      fontSize: '0.7rem', fontWeight: 600, padding: '0.15rem 0.5rem',
      borderRadius: '9999px', letterSpacing: '0.04em',
      background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.45)',
      border: '1px solid rgba(255,255,255,0.1)',
    }}>Rascunho</span>
  );
}

export function EventsClient({ orgId: _orgId }: Props) {
  const { data: events = [], isLoading } = useEvents();
  const deleteEvent = useDeleteEvent();
  const { activeMembership } = useOrgStore();
  const isAdmin = activeMembership?.role === 'admin';

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Event | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Event | null>(null);
  const [detailEvent, setDetailEvent] = useState<Event | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  function handleNew() { setSelected(null); setDialogOpen(true); }
  function handleEdit(e: Event) { setSelected(e); setDialogOpen(true); }

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

  /* ── Detail panel ─────────────────────────────────────────────────────── */
  if (detailEvent) {
    return (
      <>
        <EventDetailPanel
          event={detailEvent}
          onBack={() => setDetailEvent(null)}
          isAdmin={isAdmin}
          onEdit={() => handleEdit(detailEvent)}
        />
        <EventDialog event={selected} open={dialogOpen} onOpenChange={setDialogOpen} />
      </>
    );
  }

  /* ── List ──────────────────────────────────────────────────────────────── */
  return (
    <div className="dash-purple-bg">
      <div className="p-5 md:p-8 space-y-6">

        {/* ── Header ────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 pt-2">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] uppercase text-white/40">
              Gestão
            </p>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mt-1">
              Eventos
            </h1>
            <p className="text-white/40 text-sm mt-0.5">
              Gere os eventos da organização
            </p>
          </div>
          {isAdmin && (
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
              style={{ color: 'rgba(255,255,255,0.3)' }} />
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
                style={{ background: 'rgba(255,255,255,0.05)' }} />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="events-dark-empty">
            <CalendarDays className="h-10 w-10 mb-3" style={{ color: 'rgba(255,255,255,0.2)' }} />
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {search || statusFilter !== 'all'
                ? 'Nenhum evento encontrado.'
                : 'Nenhum evento criado ainda.'}
            </p>
            {isAdmin && !search && statusFilter === 'all' && (
              <button onClick={handleNew} className="dark-primary-btn mt-4">
                <Plus className="h-4 w-4" /> Criar primeiro evento
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {sorted.map((event) => (
              <div
                key={event.id}
                className="events-dark-card"
                onClick={() => setDetailEvent(event)}
                style={{ cursor: 'pointer' }}
              >
                {/* Cover or colour bar */}
                {event.cover_image_url ? (
                  <div
                    className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0"
                    onClick={(e) => { e.stopPropagation(); setLightboxUrl(event.cover_image_url!); }}
                    style={{ cursor: 'zoom-in' }}
                  >
                    <img src={event.cover_image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : event.color ? (
                  <div className="w-1 self-stretch rounded-full flex-shrink-0"
                    style={{ background: event.color }} />
                ) : null}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-white truncate">{event.name}</span>
                    <StatusBadge published={event.is_published} />
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs flex-wrap"
                    style={{ color: 'rgba(255,255,255,0.38)' }}>
                    <span>{formatDate(event.date)}</span>
                    {event.time && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(event.time)}
                      </span>
                    )}
                    {event.location && (
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        {event.location}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {isAdmin && (
                  <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="dark-icon-btn"
                      onClick={() => handleEdit(event)}
                      aria-label="Editar"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      className="dark-icon-btn danger"
                      onClick={() => setDeleteTarget(event)}
                      aria-label="Remover"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </div>

      {/* ── Dialogs ───────────────────────────────────── */}
      <EventDialog event={selected} open={dialogOpen} onOpenChange={setDialogOpen} />

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
