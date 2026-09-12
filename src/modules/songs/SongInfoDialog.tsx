'use client';

import { Youtube, Music, Guitar, FileText, ExternalLink, Play, BookOpen } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import type { Song } from '@/types/models';
import { youtubeThumbnail } from '@/lib/utils';

interface Props {
  song: (Song & { event_note?: string | null; event_key?: string | null }) | null;
  onOpenChange: (open: boolean) => void;
}

export function SongInfoDialog({ song, onOpenChange }: Props) {
  if (!song) return null;

  const coverUrl = youtubeThumbnail(song.youtube_url);
  const links = [
    { label: 'YouTube', url: song.youtube_url, icon: <Youtube style={{ width: '0.9rem', height: '0.9rem' }} />, color: 'var(--wis-danger)' },
    { label: 'Spotify', url: song.spotify_url, icon: <Music style={{ width: '0.9rem', height: '0.9rem' }} />, color: '#1db954' },
    { label: 'Cifra', url: song.chords, icon: <Guitar style={{ width: '0.9rem', height: '0.9rem' }} />, color: 'var(--wis-warning)' },
    { label: 'Letra', url: song.lyrics, icon: <FileText style={{ width: '0.9rem', height: '0.9rem' }} />, color: 'var(--wis-blue)' },
  ].filter((l) => !!l.url);

  // Tom deste evento tem prioridade — só cai para o tom original da música se não foi definido um tom próprio.
  const displayKey = song.event_key || song.musical_key;

  const stats = [
    song.bpm && { value: String(song.bpm), label: 'BPM' },
    displayKey && { value: displayKey, label: 'Tom' },
    song.duration && { value: song.duration, label: 'Duração' },
  ].filter(Boolean) as { value: string; label: string }[];

  return (
    <Dialog open={!!song} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 gap-0 overflow-hidden border-0 max-w-md"
        style={{ background: 'var(--wis-surface)', borderRadius: '1.25rem' }}
      >
        {coverUrl && (
          <div style={{ position: 'relative', aspectRatio: '16/9', background: '#000' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverUrl} alt={song.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            {song.youtube_url && (
              <a
                href={song.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'linear-gradient(0deg, rgba(0,0,0,0.35), rgba(0,0,0,0.05))',
                }}
              >
                <span style={{
                  width: '3rem', height: '3rem', borderRadius: '9999px',
                  background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backdropFilter: 'blur(4px)',
                }}>
                  <Play style={{ width: '1.15rem', height: '1.15rem', color: '#fff', marginLeft: '2px' }} fill="#fff" />
                </span>
              </a>
            )}
          </div>
        )}

        <div style={{ padding: '1.5rem', maxHeight: coverUrl ? '65vh' : '80vh', overflowY: 'auto' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.01em', color: 'var(--wis-text)', lineHeight: 1.2 }}>
            {song.name}
          </h2>
          {song.artist && (
            <p style={{ fontSize: '0.9rem', color: 'var(--wis-text-2)', marginTop: '0.2rem' }}>{song.artist}</p>
          )}

          {stats.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${stats.length}, 1fr)`, gap: '0.6rem', marginTop: '1.25rem' }}>
              {stats.map((s) => (
                <div key={s.label} style={{
                  textAlign: 'center', padding: '0.65rem 0.5rem', borderRadius: '0.75rem',
                  background: 'var(--wis-surface-2)', border: '1px solid var(--wis-border)',
                }}>
                  <p style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--wis-text)' }}>{s.value}</p>
                  <p style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--wis-text-3)', marginTop: '0.1rem' }}>
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          )}

          {song.bible_reference && (
            <div style={{ marginTop: '1.25rem' }}>
              <Eyebrow icon={<BookOpen style={{ width: '0.7rem', height: '0.7rem' }} />}>Referência bíblica</Eyebrow>
              <p style={{
                borderLeft: '3px solid var(--wis-warning)', paddingLeft: '0.75rem', marginTop: '0.4rem',
                fontStyle: 'italic', fontSize: '0.9rem', color: 'var(--wis-text-2)',
              }}>
                {song.bible_reference}
              </p>
            </div>
          )}

          {song.event_note && (
            <div style={{
              marginTop: '1.25rem', background: 'var(--wis-warning-bg)', border: '1px solid #f3ddb6',
              borderRadius: '0.875rem', padding: '0.85rem 1rem',
            }}>
              <p style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--wis-warning)', marginBottom: '0.3rem' }}>
                Observação para este evento
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--wis-text)', lineHeight: 1.5 }}>{song.event_note}</p>
            </div>
          )}

          {links.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1.25rem' }}>
              {links.map(({ label, url, icon, color }) => (
                <a
                  key={label}
                  href={url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    padding: '0.45rem 0.8rem', borderRadius: '9999px',
                    background: 'var(--wis-surface-2)', border: '1px solid var(--wis-border-strong)',
                    color: 'var(--wis-text)', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600,
                  }}
                >
                  <span style={{ color }}>{icon}</span>
                  {label}
                  <ExternalLink style={{ width: '0.65rem', height: '0.65rem', color: 'var(--wis-text-4)' }} />
                </a>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Eyebrow({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <p style={{
      display: 'flex', alignItems: 'center', gap: '0.35rem',
      fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
      color: 'var(--wis-text-3)',
    }}>
      {icon}
      {children}
    </p>
  );
}
