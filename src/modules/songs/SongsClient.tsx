'use client';

import { useState, useMemo } from 'react';
import { Plus, Trash2, Pencil, Search, Music } from 'lucide-react';
import { toast } from 'sonner';
import { useSongs, useDeleteSong } from '@/hooks/useSongs';
import { useMinistries } from '@/hooks/useMinistries';
import type { Song } from '@/types/models';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { SongDialog } from './SongDialog';

export function SongsClient() {
  const { data: songs = [], isLoading } = useSongs();
  const { data: ministries = [] } = useMinistries();
  const deleteSong = useDeleteSong();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Song | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Song | null>(null);
  const [search, setSearch] = useState('');
  const [ministryFilter, setMinistryFilter] = useState<string>('all');

  const ministryMap = useMemo(() => {
    const map = new Map<string, string>();
    ministries.forEach((m) => map.set(m.id, m.name));
    return map;
  }, [ministries]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return songs.filter((s) => {
      if (ministryFilter !== 'all' && s.ministry_id !== ministryFilter) return false;
      if (!q) return true;
      return s.name.toLowerCase().includes(q) || (s.artist?.toLowerCase().includes(q) ?? false);
    });
  }, [songs, search, ministryFilter]);

  function handleNew() { setSelected(null); setDialogOpen(true); }
  function handleEdit(song: Song) { setSelected(song); setDialogOpen(true); }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteSong.mutateAsync(deleteTarget.id);
      toast.success('Música removida');
      setDeleteTarget(null);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro');
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Repertório</h1>
        <Button onClick={handleNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Música
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Pesquisar por nome ou artista…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={ministryFilter} onValueChange={setMinistryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Ministério" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os ministérios</SelectItem>
            {ministries.map((m) => (
              <SelectItem key={m.id} value={m.id}>{m.icon} {m.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg border bg-muted" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <Music className="mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {search || ministryFilter !== 'all' ? 'Nenhuma música encontrada.' : 'Nenhuma música adicionada.'}
          </p>
          {!search && ministryFilter === 'all' && (
            <Button variant="outline" className="mt-4 gap-2" onClick={handleNew}>
              <Plus className="h-4 w-4" />Adicionar primeira
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((song) => (
            <div
              key={song.id}
              className="group flex items-center gap-4 rounded-lg border bg-card p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleEdit(song)}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Music className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{song.name}</p>
                <p className="text-sm text-muted-foreground truncate">{song.artist ?? '—'}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {song.musical_key && <Badge variant="secondary" className="text-xs">{song.musical_key}</Badge>}
                {song.bpm && <Badge variant="outline" className="text-xs">{song.bpm} BPM</Badge>}
                {song.ministry_id && ministryMap.has(song.ministry_id) && (
                  <Badge variant="outline" className="hidden text-xs sm:inline-flex">{ministryMap.get(song.ministry_id)}</Badge>
                )}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(song)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(song)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <SongDialog song={selected} open={dialogOpen} onOpenChange={setDialogOpen} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover música?</AlertDialogTitle>
            <AlertDialogDescription>
              Tens a certeza que queres remover <strong>{deleteTarget?.name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={confirmDelete} disabled={deleteSong.isPending}>
              {deleteSong.isPending ? 'A remover…' : 'Remover'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
