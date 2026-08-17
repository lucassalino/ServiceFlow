'use client';

import { useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Check, Minus, Music2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  useEventMinistries,
  useEventSchedules,
  useEventSetlist,
  useConfirmSchedule,
} from '@/hooks/useSchedule';
import { getFunctionLabel, getFunctionEmoji } from '@/lib/constants';
import { formatDate, formatTime, getInitials } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useOrgStore } from '@/stores/orgStore';
import type { Event, EventMinistry, Ministry, EventSchedule, Song } from '@/types/models';

interface Props {
  event: Event | null;
  open: boolean;
  onClose: () => void;
}

export function EventDetailDrawer({ event, open, onClose }: Props) {
  const { activeMembership } = useOrgStore();
  const currentUserId = activeMembership?.user_id;

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const { data: eventMinistries = [], isLoading: ministriesLoading } = useEventMinistries(open ? event?.id ?? null : null);
  const { data: setlist = [], isLoading: setlistLoading } = useEventSetlist(open ? event?.id ?? null : null);

  const color = event?.color ?? 'var(--wis-blue)';

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 48,
          background: 'rgba(0,0,0,0.65)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.25s',
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: 'fixed', right: 0, top: 0, height: '100dvh',
          width: 'min(540px, 100vw)',
          background: 'var(--wis-surface)',
          backdropFilter: 'blur(40px)',
          borderLeft: '1px solid var(--wis-border)',
          zIndex: 49,
          display: 'flex', flexDirection: 'column',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1)',
          overflowY: 'auto',
        }}
      >
        {event && (
          <>
            {/* ── Hero ──────────────────────────────────────── */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              {event.cover_image_url ? (
                <div style={{ position: 'relative', height: '14rem', overflow: 'hidden' }}>
                  <img
                    src={event.cover_image_url}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, var(--wis-surface) 100%)',
                  }} />
                </div>
              ) : (
                <div style={{
                  height: '8rem',
                  background: `linear-gradient(135deg, color-mix(in srgb, ${color} 20%, transparent) 0%, var(--wis-surface) 70%)`,
                  borderBottom: `1px solid color-mix(in srgb, ${color} 13%, transparent)`,
                }} />
              )}

              {/* Close btn */}
              <button
                onClick={onClose}
                style={{
                  position: 'absolute', top: '1rem', right: '1rem',
                  width: '2rem', height: '2rem', borderRadius: '50%',
                  background: 'rgba(0,0,0,0.5)', border: '1px solid var(--wis-border-strong)',
                  color: 'var(--wis-text)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <X style={{ width: '0.875rem', height: '0.875rem' }} />
              </button>

              {/* Event info over hero */}
              <div style={{
                position: event.cover_image_url ? 'absolute' : 'relative',
                bottom: event.cover_image_url ? '1.25rem' : undefined,
                padding: event.cover_image_url ? '0 1.5rem' : '1.25rem 1.5rem 1.5rem',
                marginTop: event.cover_image_url ? undefined : '-2rem',
              }}>
                {/* Status badge */}
                <div style={{ marginBottom: '0.5rem' }}>
                  <span style={{
                    fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.6rem',
                    borderRadius: '9999px', letterSpacing: '0.1em', textTransform: 'uppercase',
                    background: event.is_published ? 'var(--wis-success-bg)' : 'var(--wis-surface-3)',
                    color: event.is_published ? 'var(--wis-success)' : 'var(--wis-text-3)',
                    border: `1px solid ${event.is_published ? '#bfe6d3' : 'var(--wis-border-strong)'}`,
                  }}>
                    {event.is_published ? 'Publicado' : 'Rascunho'}
                  </span>
                </div>

                <h1 style={{
                  fontSize: '1.625rem', fontWeight: 800, letterSpacing: '-0.02em',
                  color: 'var(--wis-text)', lineHeight: 1.1, marginBottom: '0.625rem',
                }}>
                  {event.name}
                </h1>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <MetaItem icon={<Calendar style={{ width: '0.8rem', height: '0.8rem' }} />}>
                    {formatDate(event.date)}
                  </MetaItem>
                  {event.time && (
                    <MetaItem icon={<Clock style={{ width: '0.8rem', height: '0.8rem' }} />}>
                      {formatTime(event.time)}
                    </MetaItem>
                  )}
                  {event.location && (
                    <MetaItem icon={<MapPin style={{ width: '0.8rem', height: '0.8rem' }} />}>
                      {event.location}
                    </MetaItem>
                  )}
                </div>
              </div>
            </div>

            {/* ── Body ──────────────────────────────────────── */}
            <div style={{ flex: 1, padding: '0 1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

              {/* Description / Observations */}
              {(event.description || event.observations) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {event.description && (
                    <Section label="Descrição">
                      <p style={{ fontSize: '0.875rem', color: 'var(--wis-text-2)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                        {event.description}
                      </p>
                    </Section>
                  )}
                  {event.observations && (
                    <Section label="Observações">
                      <p style={{ fontSize: '0.875rem', color: 'var(--wis-text-2)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                        {event.observations}
                      </p>
                    </Section>
                  )}
                </div>
              )}

              {/* Ministérios & Equipa */}
              <Section label="Ministérios & Equipa">
                {ministriesLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                    {[1, 2].map((i) => (
                      <div key={i} style={{ height: '5rem', borderRadius: '0.75rem', background: 'var(--wis-surface-2)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                    ))}
                  </div>
                ) : eventMinistries.length === 0 ? (
                  <p style={{ fontSize: '0.875rem', color: 'var(--wis-text-3)' }}>
                    Nenhum ministério atribuído.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {(eventMinistries as (EventMinistry & { ministry: Ministry })[]).map((em) => (
                      <MinistrySection key={em.id} em={em} currentUserId={currentUserId} />
                    ))}
                  </div>
                )}
              </Section>

              {/* Setlist */}
              {(setlistLoading || setlist.length > 0) && (
                <Section label="Setlist">
                  {setlistLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {[1, 2, 3].map((i) => (
                        <div key={i} style={{ height: '2.75rem', borderRadius: '0.625rem', background: 'var(--wis-surface-2)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                      ))}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                      {(setlist as (Song & { order_index: number; event_key: string | null; event_note: string | null })[]).map((song, idx) => (
                        <SetlistRow key={song.id} song={song} index={idx + 1} />
                      ))}
                    </div>
                  )}
                </Section>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}

// ── Ministry section ──────────────────────────────────────────────────────────

function MinistrySection({
  em, currentUserId,
}: {
  em: EventMinistry & { ministry: Ministry };
  currentUserId: string | undefined;
}) {
  const { data: schedules = [], isLoading } = useEventSchedules(em.id);
  const confirmSchedule = useConfirmSchedule();
  const color = em.ministry.color ?? 'var(--wis-blue)';

  async function handleConfirm(schedule: EventSchedule) {
    if (schedule.user_id !== currentUserId) return;
    const next = schedule.confirmed !== true ? true : null;
    try {
      await confirmSchedule.mutateAsync({
        id: schedule.id,
        eventMinistryId: em.id,
        confirmed: next === null ? false : next,
      });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro');
    }
  }

  const confirmedCount = schedules.filter((s) => s.confirmed === true).length;

  return (
    <div style={{
      background: 'var(--wis-surface)',
      border: '1px solid var(--wis-border)',
      borderRadius: '0.875rem',
      overflow: 'hidden',
    }}>
      {/* Ministry header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '0.875rem 1rem',
        borderBottom: schedules.length > 0 ? '1px solid var(--wis-border)' : 'none',
        borderLeft: `3px solid ${color}`,
      }}>
        <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>{em.ministry.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--wis-text)' }}>{em.ministry.name}</p>
          {!isLoading && (
            <p style={{ fontSize: '0.7rem', color: 'var(--wis-text-3)', marginTop: '0.1rem' }}>
              {schedules.length} pessoa{schedules.length !== 1 ? 's' : ''}
              {schedules.length > 0 && ` · ${confirmedCount} confirmad${confirmedCount !== 1 ? 'os' : 'o'}`}
            </p>
          )}
        </div>
      </div>

      {/* People */}
      {isLoading ? (
        <div style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--wis-text-3)' }}>
          A carregar…
        </div>
      ) : schedules.length === 0 ? (
        <div style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--wis-text-3)' }}>
          Nenhuma pessoa escalada
        </div>
      ) : (
        schedules.map((schedule, idx) => {
          const name = schedule.profile?.full_name ?? schedule.user_id;
          const isMe = schedule.user_id === currentUserId;
          const isLast = idx === schedules.length - 1;
          return (
            <div key={schedule.id} style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.625rem 1rem',
              borderBottom: isLast ? 'none' : '1px solid var(--wis-border)',
            }}>
              <Avatar style={{ width: '2rem', height: '2rem', flexShrink: 0 }}>
                <AvatarFallback style={{ fontSize: '0.7rem', background: 'var(--wis-surface-4)', color: 'var(--wis-text)' }}>
                  {getInitials(name)}
                </AvatarFallback>
              </Avatar>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
                  <p style={{ fontSize: '0.8rem', fontWeight: 500, color: isMe ? 'var(--wis-text)' : 'var(--wis-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {name}{isMe && <span style={{ fontSize: '0.65rem', color: 'var(--wis-text-3)', marginLeft: '0.25rem' }}>(tu)</span>}
                  </p>
                </div>
                {schedule.functions.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.2rem' }}>
                    {schedule.functions.map((fn) => (
                      <span key={fn} style={{
                        fontSize: '0.65rem', color: 'var(--wis-text-3)',
                        background: 'var(--wis-surface-3)', borderRadius: '0.25rem',
                        padding: '0.1rem 0.35rem',
                      }}>
                        {getFunctionEmoji(fn)} {getFunctionLabel(fn)}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Confirm status */}
              <button
                disabled={!isMe || confirmSchedule.isPending}
                onClick={() => handleConfirm(schedule)}
                title={
                  schedule.confirmed === true ? 'Confirmado' :
                  schedule.confirmed === false ? 'Recusou' : 'Pendente'
                }
                style={{
                  width: '1.75rem', height: '1.75rem', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: 'none', flexShrink: 0,
                  cursor: isMe ? 'pointer' : 'default',
                  background: schedule.confirmed === true
                    ? 'var(--wis-success-bg)'
                    : schedule.confirmed === false
                    ? 'var(--wis-danger-bg)'
                    : 'var(--wis-surface-3)',
                  color: schedule.confirmed === true
                    ? 'var(--wis-success-bg)'
                    : schedule.confirmed === false
                    ? 'var(--wis-danger-bg)'
                    : 'var(--wis-surface-4)',
                  transition: 'background 0.12s',
                }}
              >
                {schedule.confirmed === true ? (
                  <Check style={{ width: '0.8rem', height: '0.8rem' }} />
                ) : schedule.confirmed === false ? (
                  <X style={{ width: '0.8rem', height: '0.8rem' }} />
                ) : (
                  <Minus style={{ width: '0.8rem', height: '0.8rem' }} />
                )}
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}

// ── Setlist row ───────────────────────────────────────────────────────────────

function SetlistRow({ song, index }: { song: Song & { order_index: number; event_key?: string | null; event_note?: string | null }; index: number }) {
  const key = song.event_key ?? song.musical_key;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.875rem',
      padding: '0.625rem 0.75rem',
      background: 'var(--wis-surface)',
      border: '1px solid var(--wis-border)',
      borderRadius: '0.625rem',
    }}>
      <span style={{
        width: '1.5rem', textAlign: 'right', flexShrink: 0,
        fontSize: '0.75rem', fontWeight: 700, color: 'var(--wis-text-4)',
      }}>
        {index}
      </span>
      <div style={{
        width: '2rem', height: '2rem', borderRadius: '0.5rem', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--wis-warning-bg)',
      }}>
        <Music2 style={{ width: '0.875rem', height: '0.875rem', color: 'var(--wis-warning)' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--wis-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {song.name}
        </p>
        {song.artist && (
          <p style={{ fontSize: '0.72rem', color: 'var(--wis-text-3)', marginTop: '0.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {song.artist}
          </p>
        )}
        {song.event_note && (
          <p style={{
            fontSize: '0.68rem', color: 'var(--wis-warning)', marginTop: '0.15rem', lineHeight: 1.4,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {song.event_note}
          </p>
        )}
      </div>
      <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}>
        {key && (
          <span style={{
            fontSize: '0.65rem', fontWeight: 600, padding: '0.15rem 0.45rem',
            borderRadius: '9999px', background: 'var(--wis-surface-3)',
            color: 'var(--wis-text-2)', border: '1px solid var(--wis-border-strong)',
          }}>{key}</span>
        )}
        {song.bpm && (
          <span style={{
            fontSize: '0.65rem', fontWeight: 600, padding: '0.15rem 0.45rem',
            borderRadius: '9999px', background: 'var(--wis-surface-3)',
            color: 'var(--wis-text-2)', border: '1px solid var(--wis-border-strong)',
          }}>{song.bpm} BPM</span>
        )}
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{
        fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em',
        textTransform: 'uppercase', color: 'var(--wis-text-3)',
        marginBottom: '0.75rem',
      }}>
        {label}
      </p>
      {children}
    </div>
  );
}

function MetaItem({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--wis-text-2)' }}>
      {icon}
      {children}
    </span>
  );
}
