'use client';

import { useState, useMemo } from 'react';
import { Plus, Trash2, Pencil, Search, Music, Youtube, Guitar, FileText, Trophy, ListMusic, FileUp } from 'lucide-react';
import { toast } from 'sonner';
import { useSongs, useSongsRanking, useDeleteSong } from '@/hooks/useSongs';
import { useMinistries } from '@/hooks/useMinistries';
import { useOrgStore } from '@/stores/orgStore';
import { formatDate, youtubeThumbnail } from '@/lib/utils';
import type { Song } from '@/types/models';
import type { SongRankingEntry } from '@/actions/songs';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { SongFormPanel } from './SongFormPanel';
import { SongDetailPanel } from './SongDetailPanel';
import { SongCsvImportDialog } from './SongCsvImportDialog';

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
  const { data: ranking = [], isLoading: rankingLoading } = useSongsRanking();
  const { data: ministries = [] } = useMinistries();
  const deleteSong = useDeleteSong();
  const { activeOrg, activeMembership } = useOrgStore();
  const role = activeMembership?.role;
  const isAdmin = role === 'admin';
  const canManage = role === 'admin' || role === 'leader'; // criar/editar

  const [formSong, setFormSong] = useState<Song | null | 'new'>(null);
  const [deleteTarget, setDeleteTarget] = useState<Song | null>(null);
  const [detailSong, setDetailSong] = useState<Song | null>(null);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'list' | 'ranking'>('list');
  const [importOpen, setImportOpen] = useState(false);

  const ministryMap = useMemo(() => {
    const map = new Map<string, { name: string; icon: string }>();
    ministries.forEach((m) => map.set(m.id, { name: m.name, icon: m.icon }));
    return map;
  }, [ministries]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return songs.filter((s) => {
      if (!q) return true;
      return s.name.toLowerCase().includes(q) || (s.artist?.toLowerCase().includes(q) ?? false);
    });
  }, [songs, search]);

  function handleNew() { setFormSong('new'); }
  function handleEdit(song: Song) { setFormSong(song); }

  function handleDeleteRequest(song: Song) {
    setDetailSong(null);
    setDeleteTarget(song);
  }

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

  /* ── Form panel ───────────────────────────────────────────── */
  if (formSong !== null) {
    return (
      <SongFormPanel
        song={formSong === 'new' ? null : formSong}
        onBack={() => setFormSong(null)}
        onSaved={() => {
          if (formSong !== 'new' && detailSong) {
            const updated = songs.find((s) => s.id === (formSong as Song).id);
            if (updated) setDetailSong(updated);
          }
        }}
      />
    );
  }

  /* ── Detail panel ─────────────────────────────────────────── */
  if (detailSong) {
    const ministry = detailSong.ministry_id ? ministryMap.get(detailSong.ministry_id) : undefined;
    return (
      <>
        <SongDetailPanel
          song={detailSong}
          ministryName={ministry?.name}
          ministryIcon={ministry?.icon}
          onBack={() => setDetailSong(null)}
          isAdmin={isAdmin}
          canManage={canManage}
          onEdit={() => handleEdit(detailSong)}
          onDelete={() => handleDeleteRequest(detailSong)}
        />
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
      </>
    );
  }

  /* ── List ──────────────────────────────────────────────────── */
  return (
    <div className="dash-purple-bg">
      <div className="p-5 md:p-8 space-y-6">

        {/* ── Header ──────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 pt-2">
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
          {canManage && (
            <div className="flex gap-2 items-center w-full sm:w-auto flex-shrink-0">
              <button
                onClick={() => { if (!activeOrg?.id) { toast.error('Organização não encontrada'); return; } setImportOpen(true); }}
                title="Importar músicas de um ficheiro CSV"
                className="flex-1 sm:flex-none whitespace-nowrap"
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                  padding: '0.55rem 0.95rem', borderRadius: '0.6rem', fontSize: '0.85rem', fontWeight: 600,
                  background: 'rgba(165,180,252,0.12)', border: '1px solid rgba(165,180,252,0.25)',
                  color: '#a5b4fc', cursor: 'pointer',
                }}
              >
                <FileUp className="h-4 w-4 flex-shrink-0" />
                Importar CSV
              </button>
              <button onClick={handleNew} className="dark-primary-btn flex-1 sm:flex-none justify-center whitespace-nowrap">
                <Plus className="h-4 w-4 flex-shrink-0" />
                Nova Música
              </button>
            </div>
          )}
        </div>

        {/* ── View toggle ─────────────────────────────────── */}
        <div style={{ display: 'inline-flex', padding: '0.2rem', borderRadius: '0.625rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {([
            { key: 'list', label: 'Lista', icon: ListMusic },
            { key: 'ranking', label: 'Ranking', icon: Trophy },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setView(key)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.4rem 0.875rem', borderRadius: '0.5rem',
                fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', border: 'none',
                background: view === key ? '#fff' : 'transparent',
                color: view === key ? '#0a0a0f' : 'rgba(255,255,255,0.5)',
                transition: 'background 0.12s, color 0.12s',
              }}
            >
              <Icon style={{ width: '0.85rem', height: '0.85rem' }} />
              {label}
            </button>
          ))}
        </div>

        {view === 'list' ? (
          <>
            {/* ── Filters ───────────────────────────────────── */}
            <div className="dark-inputs">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'rgba(255,255,255,0.3)' }} />
                <Input
                  placeholder="Pesquisar por nome ou artista…"
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
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
                  {search ? 'Nenhuma música encontrada.' : 'Nenhuma música adicionada.'}
                </p>
                {canManage && !search && (
                  <button onClick={handleNew} className="dark-primary-btn mt-4">
                    <Plus className="h-4 w-4" /> Adicionar primeira música
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2.5">
                {filtered.map((song) => {
                  const ministry = song.ministry_id ? ministryMap.get(song.ministry_id) : undefined;
                  return (
                    <SongRow
                      key={song.id}
                      song={song}
                      ministryName={ministry?.name}
                      onClick={() => setDetailSong(song)}
                      onEdit={() => handleEdit(song)}
                      onDelete={() => setDeleteTarget(song)}
                      isAdmin={isAdmin}
                      canManage={canManage}
                    />
                  );
                })}
              </div>
            )}
          </>
        ) : (
          /* ── Ranking ───────────────────────────────────── */
          rankingLoading ? (
            <div className="space-y-2.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-[4.5rem] animate-pulse rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.05)' }} />
              ))}
            </div>
          ) : ranking.length === 0 ? (
            <div className="events-dark-empty">
              <Trophy className="h-10 w-10 mb-3" style={{ color: 'rgba(255,255,255,0.2)' }} />
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Ainda nenhuma música foi tocada em eventos.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {ranking.map((entry, idx) => {
                const ministry = entry.ministryId ? ministryMap.get(entry.ministryId) : undefined;
                const fullSong = songs.find((s) => s.id === entry.songId);
                return (
                  <RankingRow
                    key={entry.songId}
                    rank={idx + 1}
                    entry={entry}
                    ministryName={ministry?.name}
                    onClick={() => fullSong && setDetailSong(fullSong)}
                  />
                );
              })}
            </div>
          )
        )}

      </div>

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

      {activeOrg?.id && (
        <SongCsvImportDialog
          orgId={activeOrg.id}
          open={importOpen}
          onOpenChange={setImportOpen}
        />
      )}
    </div>
  );
}

// ── Ranking row ──────────────────────────────────────────────────────────────

const MEDAL_COLORS: Record<number, string> = { 1: '#fcd34d', 2: '#d1d5db', 3: '#d97706' };

function RankingRow({
  rank, entry, ministryName, onClick,
}: {
  rank: number;
  entry: SongRankingEntry;
  ministryName?: string;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const medal = MEDAL_COLORS[rank];

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '1rem',
        padding: '0.875rem 1rem',
        background: hovered ? 'rgba(35,35,40,0.9)' : 'rgba(22,22,26,0.85)',
        border: `1px solid ${hovered ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: '0.875rem',
        cursor: 'pointer',
        transition: 'background 0.15s, border-color 0.15s, transform 0.12s',
        transform: hovered ? 'translateY(-1px)' : 'none',
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
      }}
    >
      {/* Rank */}
      <div style={{
        width: '2.25rem', textAlign: 'center', flexShrink: 0,
        fontSize: medal ? '1.1rem' : '0.95rem', fontWeight: 800,
        color: medal ?? 'rgba(255,255,255,0.3)',
      }}>
        {rank}º
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: '0.875rem', fontWeight: 600, color: '#ffffff',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {entry.name}
        </p>
        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.38)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '0.1rem' }}>
          {entry.artist ?? '—'}
          {entry.lastPlayedDate && ` · última vez ${formatDate(entry.lastPlayedDate)}`}
        </p>
      </div>

      {/* Chips */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
        {ministryName && (
          <span className="hidden md:inline-flex">
            <Chip>{ministryName}</Chip>
          </span>
        )}
        <span style={{
          fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.6rem',
          borderRadius: '9999px', letterSpacing: '0.02em', whiteSpace: 'nowrap',
          background: 'rgba(165,180,252,0.15)', color: '#a5b4fc',
          border: '1px solid rgba(165,180,252,0.25)',
        }}>
          {entry.timesPlayed}× tocada
        </span>
      </div>
    </div>
  );
}

// ── Song row ─────────────────────────────────────────────────────────────────

function SongRow({
  song, ministryName, onClick, onEdit, onDelete, isAdmin, canManage,
}: {
  song: Song;
  ministryName?: string;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isAdmin: boolean;
  canManage: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  const linkIcons = [
    song.youtube_url && <Youtube key="yt" style={{ width: '0.8rem', height: '0.8rem', color: '#f87171' }} />,
    song.spotify_url && <Music key="sp" style={{ width: '0.8rem', height: '0.8rem', color: '#1db954' }} />,
    song.chords     && <Guitar key="ch" style={{ width: '0.8rem', height: '0.8rem', color: '#fcd34d' }} />,
    song.lyrics     && <FileText key="ly" style={{ width: '0.8rem', height: '0.8rem', color: '#a5b4fc' }} />,
  ].filter(Boolean);

  const coverUrl = youtubeThumbnail(song.youtube_url);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '1rem',
        padding: '0.875rem 1rem',
        background: hovered ? 'rgba(35,35,40,0.9)' : 'rgba(22,22,26,0.85)',
        border: `1px solid ${hovered ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: '0.875rem',
        cursor: 'pointer',
        transition: 'background 0.15s, border-color 0.15s, transform 0.12s',
        transform: hovered ? 'translateY(-1px)' : 'none',
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
      }}
    >
      {/* Icon / capa */}
      {coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverUrl}
          alt={song.name}
          style={{
            width: '2.5rem', height: '2.5rem', borderRadius: '0.625rem', flexShrink: 0,
            objectFit: 'cover', background: 'rgba(255,255,255,0.06)',
          }}
        />
      ) : (
        <div style={{
          width: '2.5rem', height: '2.5rem', borderRadius: '0.625rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          background: 'rgba(255,255,255,0.06)',
        }}>
          <Music style={{ width: '1.1rem', height: '1.1rem', color: 'rgba(255,255,255,0.35)' }} />
        </div>
      )}

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: '0.875rem', fontWeight: 600, color: '#ffffff',
          overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.3,
        }}>
          {song.name}
        </p>
        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.38)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '0.1rem' }}>
          {song.artist ?? '—'}
        </p>
      </div>

      {/* Chips + link icons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0, maxWidth: '45%', flexWrap: 'nowrap', justifyContent: 'flex-end' }}>
        {song.musical_key && <Chip>{song.musical_key}</Chip>}
        {song.bpm && <span className="hidden sm:inline-flex"><Chip>{song.bpm} BPM</Chip></span>}
        {ministryName && (
          <span className="hidden md:inline-flex">
            <Chip>{ministryName}</Chip>
          </span>
        )}
        {linkIcons.length > 0 && (
          <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', opacity: 0.7 }}>
            {linkIcons}
          </div>
        )}
      </div>

      {/* Actions — gestor (admin/líder), on hover */}
      {canManage && (
        <div
          style={{ display: 'flex', gap: '0.25rem', flexShrink: 0, opacity: hovered ? 1 : 0, transition: 'opacity 0.15s' }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="dark-icon-btn" onClick={onEdit} title="Editar">
            <Pencil style={{ width: '0.75rem', height: '0.75rem' }} />
          </button>
          {isAdmin && (
            <button className="dark-icon-btn danger" onClick={onDelete} title="Remover">
              <Trash2 style={{ width: '0.75rem', height: '0.75rem' }} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
