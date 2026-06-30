'use client';

import { useState, useMemo } from 'react';
import { Plus, Trash2, Pencil, Search, Music } from 'lucide-react';
import { toast } from 'sonner';
import { useSongs, useDeleteSong } from '@/hooks/useSongs';
import { useMinistries } from '@/hooks/useMinistries';
import { useOrgStore } from '@/stores/orgStore';
import type { Song } from '@/types/models';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { SongDialog } from './SongDialog';

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      fontSize: '0.7rem', fontWeight: 600, padding: '0.15rem 0.55rem',
      borderRadius: '9999px', letterSpacing: '0.04em',
      background: 'rgba(255,255,255,0.08)',
      color: 'rgba(255,255,255,0.5)',
      border: '1px solid rgba(255,255,255,0.1)',
      whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  );
}

export function SongsClient() {
  const { data: songs = [], isLoading } = useSongs();
  const { data: ministries = [] } = useMinistries();
  const deleteSong = useDeleteSong();
  const { activeMembership } = useOrgStore();
  const isAdmin = activeMembership?.role === 'admin';

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
    <div className="dash-purple-bg">
      <div className="p-5 md:p-8 space-y-6">

        {/* ── Header ──────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 pt-2">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] uppercase"
              style={{ color: 'rgba(255,255,255,0.4)' }}>
              Organização
            </p>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mt-1">
              Repertório
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {songs.length > 0
                ? `${songs.length} música${songs.length !== 1 ? 's' : ''} no repertório`
                : 'Músicas da organização'}
            </p>
          </div>
          {isAdmin && (
            <button onClick={handleNew} className="dark-primary-btn">
              <Plus className="h-4 w-4" />
              Nova Música
            </button>
          )}
        </div>

        {/* ── Filters ───────────────────────────────────── */}
        <div className="dark-inputs flex flex-col gap-2.5 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 pointer-events-none"
              style={{ color: 'rgba(255,255,255,0.3)' }} />
            <Input
              placeholder="Pesquisar por nome ou artista…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {ministries.length > 0 && (
            <Select value={ministryFilter} onValueChange={setMinistryFilter}>
              <SelectTrigger className="w-full sm:w-52">
                <SelectValue placeholder="Ministério" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os ministérios</SelectItem>
                {ministries.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.icon} {m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* ── List ──────────────────────────────────────── */}
        {isLoading ? (
          <div className="space-y-2.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-[4.5rem] animate-pulse rounded-xl"
                style={{ background: 'rgba(255,255,255,0.05)' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="events-dark-empty">
            <Music className="h-10 w-10 mb-3" style={{ color: 'rgba(255,255,255,0.2)' }} />
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {search || ministryFilter !== 'all'
                ? 'Nenhuma música encontrada.'
                : 'Nenhuma música adicionada.'}
            </p>
            {isAdmin && !search && ministryFilter === 'all' && (
              <button onClick={handleNew} className="dark-primary-btn mt-4">
                <Plus className="h-4 w-4" /> Adicionar primeira música
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((song) => (
              <SongRow
                key={song.id}
                song={song}
                ministryName={song.ministry_id ? ministryMap.get(song.ministry_id) : undefined}
                onEdit={() => handleEdit(song)}
                onDelete={() => setDeleteTarget(song)}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        )}

      </div>

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
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
              disabled={deleteSong.isPending}
            >
              {deleteSong.isPending ? 'A remover…' : 'Remover'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Song row ─────────────────────────────────────────────────────────────────

function SongRow({
  song, ministryName, onEdit, onDelete, isAdmin,
}: {
  song: Song;
  ministryName?: string;
  onEdit: () => void;
  onDelete: () => void;
  isAdmin: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => isAdmin && onEdit()}
      style={{
        display: 'flex', alignItems: 'center', gap: '1rem',
        padding: '0.875rem 1rem',
        background: hovered ? 'rgba(35,35,40,0.9)' : 'rgba(22,22,26,0.85)',
        border: `1px solid ${hovered ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: '0.875rem',
        cursor: isAdmin ? 'pointer' : 'default',
        transition: 'background 0.15s, border-color 0.15s, transform 0.12s',
        transform: hovered ? 'translateY(-1px)' : 'none',
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
      }}
    >
      {/* Icon */}
      <div style={{
        width: '2.5rem', height: '2.5rem', borderRadius: '0.625rem',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        background: 'rgba(252,211,77,0.12)',
      }}>
        <Music style={{ width: '1.1rem', height: '1.1rem', color: '#fcd34d' }} />
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {song.name}
        </p>
        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.38)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '0.1rem' }}>
          {song.artist ?? '—'}
        </p>
      </div>

      {/* Chips */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        {song.musical_key && <Chip>{song.musical_key}</Chip>}
        {song.bpm && <Chip>{song.bpm} BPM</Chip>}
        {ministryName && (
          <span className="hidden sm:inline-flex">
            <Chip>{ministryName}</Chip>
          </span>
        )}
      </div>

      {/* Actions — admin only */}
      {isAdmin && (
        <div
          style={{ display: 'flex', gap: '0.25rem', flexShrink: 0, opacity: hovered ? 1 : 0, transition: 'opacity 0.15s' }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="dark-icon-btn" onClick={onEdit} title="Editar">
            <Pencil style={{ width: '0.75rem', height: '0.75rem' }} />
          </button>
          <button className="dark-icon-btn danger" onClick={onDelete} title="Remover">
            <Trash2 style={{ width: '0.75rem', height: '0.75rem' }} />
          </button>
        </div>
      )}
    </div>
  );
}
