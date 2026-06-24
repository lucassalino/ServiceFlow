'use client';

import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, MapPin, Clock, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useEvents, useDeleteEvent } from '@/hooks/useEvents';
import type { Event } from '@/types/models';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { formatDate, formatTime } from '@/lib/utils';
import { EventDialog } from './EventDialog';

interface Props { orgId: string }

type StatusFilter = 'all' | 'upcoming' | 'past' | 'published' | 'draft';

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'upcoming', label: 'Próximos' },
  { value: 'past', label: 'Passados' },
  { value: 'published', label: 'Publicados' },
  { value: 'draft', label: 'Rascunhos' },
];

export function EventsClient({ orgId: _orgId }: Props) {
  const { data: events = [], isLoading } = useEvents();
  const deleteEvent = useDeleteEvent();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Event | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Event | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

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
        const matchesText =
          event.name.toLowerCase().includes(q) ||
          (event.location?.toLowerCase().includes(q) ?? false);
        if (!matchesText) return false;
      }
      switch (statusFilter) {
        case 'upcoming': return event.date >= today;
        case 'past': return event.date < today;
        case 'published': return event.is_published;
        case 'draft': return !event.is_published;
        default: return true;
      }
    });
  }, [events, search, statusFilter]);

  const sorted = [...filtered].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Eventos</h1>
        <Button onClick={handleNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Evento
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg border bg-muted" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">
            {search || statusFilter !== 'all' ? 'Nenhum evento encontrado.' : 'Nenhum evento criado.'}
          </p>
          {!search && statusFilter === 'all' && (
            <Button variant="outline" className="mt-4 gap-2" onClick={handleNew}>
              <Plus className="h-4 w-4" />Criar primeiro evento
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((event) => (
            <div
              key={event.id}
              className="flex items-center gap-4 rounded-lg border bg-card p-4 hover:bg-accent/30 transition-colors cursor-pointer"
              onClick={() => handleEdit(event)}
            >
              {event.color && (
                <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: event.color }} />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold truncate">{event.name}</p>
                  {event.is_published
                    ? <Badge className="text-xs">Publicado</Badge>
                    : <Badge variant="secondary" className="text-xs">Rascunho</Badge>}
                </div>
                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
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
              <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(event)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(event)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <EventDialog event={selected} open={dialogOpen} onOpenChange={setDialogOpen} />

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
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={confirmDelete} disabled={deleteEvent.isPending}>
              {deleteEvent.isPending ? 'A remover…' : 'Remover'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
