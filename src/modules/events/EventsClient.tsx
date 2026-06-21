'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, MapPin, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useEvents, useDeleteEvent } from '@/hooks/useEvents';
import type { Event } from '@/types/models';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { formatDate, formatTime } from '@/lib/utils';
import { EventDialog } from './EventDialog';

interface Props { orgId: string }

export function EventsClient({ orgId: _orgId }: Props) {
  const { data: events = [], isLoading } = useEvents();
  const deleteEvent = useDeleteEvent();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Event | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Event | null>(null);

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

  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Eventos</h1>
        <Button onClick={handleNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Evento
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg border bg-muted" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">Nenhum evento criado.</p>
          <Button variant="outline" className="mt-4 gap-2" onClick={handleNew}>
            <Plus className="h-4 w-4" />Criar primeiro evento
          </Button>
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
