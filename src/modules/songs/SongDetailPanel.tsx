'use client';

import { ArrowLeft, Youtube, Music, Guitar, FileText, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import type { Song } from '@/types/models';
import { youtubeThumbnail } from '@/lib/utils';

interface Props {
  song: Song;
  ministryName?: string;
  ministryIcon?: string;
  onBack: () => void;
  isAdmin: boolean;
  canManage?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export function SongDetailPanel({ song, ministryName, ministryIcon, onBack, isAdmin, canManage = isAdmin, onEdit, onDelete }: Props) {
  const links = [
    { label: 'YouTube', url: song.youtube_url, icon: <Youtube style={{ width: '1.1rem', height: '1.1rem' }} />, color: '#f87171' },
    { label: 'Spotify',  url: song.spotify_url, icon: <Music   style={{ width: '1.1rem', height: '1.1rem' }} />, color: '#1db954' },
    { label: 'Cifra',   url: song.chords,       icon: <Guitar  style={{ width: '1.1rem', height: '1.1rem' }} />, color: '#fcd34d' },
    { label: 'Letra',   url: song.lyrics,        icon: <FileText style={{ width: '1.1rem', height: '1.1rem' }} />, color: '#a5b4fc' },
  ];

  const activeLinks = links.filter((l) => !!l.url);
  // Capa própria tem prioridade; caso contrário usa a thumbnail do YouTube.
  const coverUrl = song.cover_image_url || youtubeThumbnail(song.youtube_url);

  return (
    <div className="dash-purple-bg" style={{ minHeight: '100%' }}>
      <div className="panel-pad">

        {/* ── Top bar ────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
          <button
            onClick={onBack}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
              fontSize: '0.8rem', fontWeight: 500, color: 'rgba(255,255,255,0.55)',
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              transition: 'color 0.12s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
          >
            <ArrowLeft style={{ width: '0.875rem', height: '0.875rem' }} />
            Repertório
          </button>

          {canManage && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={onEdit}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                  padding: '0.375rem 0.875rem',
                  fontSize: '0.775rem', fontWeight: 500,
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '0.5rem',
                  color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
              >
                <Pencil style={{ width: '0.75rem', height: '0.75rem' }} />
                Editar
              </button>
              {isAdmin && (
                <button
                  onClick={onDelete}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                    padding: '0.375rem 0.875rem',
                    fontSize: '0.775rem', fontWeight: 500,
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: '0.5rem',
                    color: '#f87171', cursor: 'pointer',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.18)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
                >
                  <Trash2 style={{ width: '0.75rem', height: '0.75rem' }} />
                  Remover
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Hero ─────────────────────────────────── */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: '1rem',
          padding: '1.75rem 1.5rem',
          marginBottom: '1.75rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem' }}>
            {coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverUrl}
                alt={song.name}
                style={{
                  width: '3.25rem', height: '3.25rem', borderRadius: '0.875rem', flexShrink: 0,
                  objectFit: 'cover', background: 'rgba(255,255,255,0.08)',
                }}
              />
            ) : (
              <div style={{
                width: '3.25rem', height: '3.25rem', borderRadius: '0.875rem', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(255,255,255,0.08)',
              }}>
                <Music style={{ width: '1.5rem', height: '1.5rem', color: 'rgba(255,255,255,0.5)' }} />
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{
                fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em',
                color: '#fff', lineHeight: 1.15, marginBottom: '0.375rem',
              }}>
                {song.name}
              </h1>
              {song.artist && (
                <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.875rem' }}>
                  {song.artist}
                </p>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {song.musical_key && <Chip>{song.musical_key}</Chip>}
                {song.bpm && <Chip>{song.bpm} BPM</Chip>}
                {song.duration && <Chip>{song.duration}</Chip>}
                {song.bible_reference && <Chip>{song.bible_reference}</Chip>}
                {ministryName && (
                  <Chip>{ministryIcon ? `${ministryIcon} ` : ''}{ministryName}</Chip>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Links ────────────────────────────────── */}
        {activeLinks.length > 0 ? (
          <Section label="Links">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(10rem, 1fr))', gap: '0.75rem' }}>
              {activeLinks.map(({ label, url, icon, color }) => (
                <a
                  key={label}
                  href={url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.625rem',
                    padding: '0.875rem 1rem',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.09)',
                    borderRadius: '0.75rem',
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    transition: 'background 0.12s, transform 0.12s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.transform = 'none'; }}
                >
                  <span style={{ color }}>{icon}</span>
                  <span style={{ flex: 1, color: 'rgba(255,255,255,0.8)' }}>{label}</span>
                  <ExternalLink style={{ width: '0.75rem', height: '0.75rem', color: 'rgba(255,255,255,0.25)' }} />
                </a>
              ))}
            </div>
          </Section>
        ) : (
          <div style={{
            padding: '2rem', textAlign: 'center',
            background: 'rgba(255,255,255,0.03)',
            border: '1px dashed rgba(255,255,255,0.1)',
            borderRadius: '0.875rem',
          }}>
            <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.3)' }}>
              Nenhum link adicionado.
            </p>
            {canManage && (
              <button
                onClick={onEdit}
                style={{
                  marginTop: '0.875rem',
                  display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                  padding: '0.5rem 1rem',
                  fontSize: '0.8rem', fontWeight: 600,
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '0.5rem',
                  color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
                }}
              >
                <Pencil style={{ width: '0.75rem', height: '0.75rem' }} />
                Adicionar links
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{
        fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em',
        textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)',
        marginBottom: '0.75rem',
      }}>
        {label}
      </p>
      {children}
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      fontSize: '0.72rem', fontWeight: 600, padding: '0.2rem 0.6rem',
      borderRadius: '9999px', background: 'rgba(255,255,255,0.08)',
      color: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.1)',
      whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  );
}
