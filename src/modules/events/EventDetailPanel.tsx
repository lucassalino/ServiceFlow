'use client';

import { ArrowLeft, Calendar, Clock, MapPin, Check, X, Minus, Music2 } from 'lucide-react';
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
  event: Event;
  onBack: () => void;
  isAdmin: boolean;
  onEdit: () => void;
}

export function EventDetailPanel({ event, onBack, isAdmin, onEdit }: Props) {
  const { activeMembership } = useOrgStore();
  const currentUserId = activeMembership?.user_id;

  const { data: eventMinistries = [], isLoading: ministriesLoading } = useEventMinistries(event.id);
  const { data: setlist = [], isLoading: setlistLoading } = useEventSetlist(event.id);

  const color = event.color ?? '#a5b4fc';

  return (
    <div className="dash-purple-bg" style={{ minHeight: '100%' }}>
      <div style={{ padding: '1.5rem 2rem 3rem' }}>

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
            Eventos
          </button>

          {isAdmin && (
            <button onClick={onEdit} style={{
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
              Editar evento
            </button>
          )}
        </div>

        {/* ── Hero ────────────────────────────────────── */}
        <div style={{
          borderRadius: '1rem', overflow: 'hidden',
          marginBottom: '1.75rem',
          border: '1px solid rgba(255,255,255,0.08)',
          position: 'relative',
        }}>
          {event.cover_image_url ? (
            <>
              <div style={{ height: '16rem', overflow: 'hidden' }}>
                <img src={event.cover_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 40%, rgba(10,10,14,0.95) 100%)',
              }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1.5rem' }}>
                <HeroContent event={event} />
              </div>
            </>
          ) : (
            <div style={{
              padding: '1.75rem 1.5rem',
              background: `linear-gradient(135deg, ${color}20 0%, rgba(22,22,26,0) 60%)`,
              borderLeft: `4px solid ${color}`,
            }}>
              <HeroContent event={event} />
            </div>
          )}
        </div>

        {/* ── Description / Observations ─────────────── */}
        {(event.description || event.observations) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.75rem' }}>
            {event.description && (
              <Section label="Descrição">
                <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {event.description}
                </p>
              </Section>
            )}
            {event.observations && (
              <Section label="Observações">
                <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {event.observations}
                </p>
              </Section>
            )}
          </div>
        )}

        {/* ── Ministérios & Equipa ───────────────────── */}
        <div style={{ marginBottom: '1.75rem' }}>
          <Section label="Ministérios & Equipa">
            {ministriesLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} style={{ height: '5rem', borderRadius: '0.875rem', background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                ))}
              </div>
            ) : eventMinistries.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', borderRadius: '0.875rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.3)' }}>
                  Nenhum ministério atribuído a este evento.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {(eventMinistries as (EventMinistry & { ministry: Ministry })[]).map((em) => (
                  <MinistrySection key={em.id} em={em} currentUserId={currentUserId} />
                ))}
              </div>
            )}
          </Section>
        </div>

        {/* ── Setlist ────────────────────────────────── */}
        {(setlistLoading || setlist.length > 0) && (
          <Section label={`Setlist${!setlistLoading ? ` · ${setlist.length} música${setlist.length !== 1 ? 's' : ''}` : ''}`}>
            {setlistLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} style={{ height: '3rem', borderRadius: '0.625rem', background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                {(setlist as (Song & { order_index: number })[]).map((song, idx) => (
                  <SetlistRow key={song.id} song={song} index={idx + 1} />
                ))}
              </div>
            )}
          </Section>
        )}

      </div>
    </div>
  );
}

// ── Hero content ─────────────────────────────────────────────────────────────

function HeroContent({ event }: { event: Event }) {
  return (
    <>
      <div style={{ marginBottom: '0.5rem' }}>
        <span style={{
          fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.6rem',
          borderRadius: '9999px', letterSpacing: '0.1em', textTransform: 'uppercase',
          background: event.is_published ? 'rgba(110,231,183,0.2)' : 'rgba(255,255,255,0.08)',
          color: event.is_published ? '#6ee7b7' : 'rgba(255,255,255,0.4)',
          border: `1px solid ${event.is_published ? 'rgba(110,231,183,0.3)' : 'rgba(255,255,255,0.1)'}`,
        }}>
          {event.is_published ? 'Publicado' : 'Rascunho'}
        </span>
      </div>
      <h1 style={{
        fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em',
        color: '#fff', lineHeight: 1.1, marginBottom: '0.75rem',
      }}>
        {event.name}
      </h1>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
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
  const color = em.ministry.color ?? '#a5b4fc';

  const confirmedCount = schedules.filter((s) => s.confirmed === true).length;

  async function handleConfirm(schedule: EventSchedule) {
    if (schedule.user_id !== currentUserId) return;
    const next = schedule.confirmed !== true;
    try {
      await confirmSchedule.mutateAsync({ id: schedule.id, eventMinistryId: em.id, confirmed: next });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro');
    }
  }

  return (
    <div style={{
      background: 'rgba(22,22,26,0.85)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '0.875rem', overflow: 'hidden',
    }}>
      {/* Ministry header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.875rem',
        padding: '0.875rem 1.125rem',
        borderBottom: schedules.length > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
        borderLeft: `3px solid ${color}`,
      }}>
        <span style={{ fontSize: '1.375rem', lineHeight: 1, flexShrink: 0 }}>{em.ministry.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>{em.ministry.name}</p>
          {!isLoading && (
            <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', marginTop: '0.1rem' }}>
              {schedules.length} pessoa{schedules.length !== 1 ? 's' : ''}
              {schedules.length > 0 && ` · ${confirmedCount} confirmad${confirmedCount !== 1 ? 'os' : 'o'}`}
            </p>
          )}
        </div>
      </div>

      {/* People */}
      {isLoading ? (
        <div style={{ padding: '0.875rem 1.125rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>
          A carregar…
        </div>
      ) : schedules.length === 0 ? (
        <div style={{ padding: '0.875rem 1.125rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>
          Nenhuma pessoa escalada
        </div>
      ) : (
        schedules.map((schedule, idx) => {
          const name = schedule.profile?.full_name ?? schedule.user_id;
          const isMe = schedule.user_id === currentUserId;
          const isLast = idx === schedules.length - 1;
          return (
            <div key={schedule.id} style={{
              display: 'flex', alignItems: 'center', gap: '0.875rem',
              padding: '0.75rem 1.125rem',
              borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.04)',
            }}>
              <Avatar style={{ width: '2.25rem', height: '2.25rem', flexShrink: 0 }}>
                <AvatarFallback style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}>
                  {getInitials(name)}
                </AvatarFallback>
              </Avatar>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 500, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  {name}
                  {isMe && (
                    <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>(tu)</span>
                  )}
                </p>
                {schedule.functions.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.25rem' }}>
                    {schedule.functions.map((fn) => (
                      <span key={fn} style={{
                        fontSize: '0.68rem', color: 'rgba(255,255,255,0.45)',
                        background: 'rgba(255,255,255,0.07)', borderRadius: '0.3rem',
                        padding: '0.1rem 0.4rem',
                      }}>
                        {getFunctionEmoji(fn)} {getFunctionLabel(fn)}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Confirm toggle — only for the current user */}
              <button
                disabled={!isMe || confirmSchedule.isPending}
                onClick={() => handleConfirm(schedule)}
                title={
                  schedule.confirmed === true ? 'Confirmado — clique para cancelar' :
                  schedule.confirmed === false ? 'Recusou' : 'Clique para confirmar'
                }
                style={{
                  width: '2rem', height: '2rem', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: 'none', flexShrink: 0,
                  cursor: isMe ? 'pointer' : 'default',
                  background: schedule.confirmed === true
                    ? 'rgba(110,231,183,0.2)'
                    : schedule.confirmed === false
                    ? 'rgba(239,68,68,0.18)'
                    : 'rgba(255,255,255,0.06)',
                  color: schedule.confirmed === true
                    ? '#6ee7b7'
                    : schedule.confirmed === false
                    ? '#f87171'
                    : 'rgba(255,255,255,0.22)',
                  transition: 'background 0.12s, color 0.12s',
                }}
              >
                {schedule.confirmed === true ? (
                  <Check style={{ width: '0.875rem', height: '0.875rem' }} />
                ) : schedule.confirmed === false ? (
                  <X style={{ width: '0.875rem', height: '0.875rem' }} />
                ) : (
                  <Minus style={{ width: '0.875rem', height: '0.875rem' }} />
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

function SetlistRow({ song, index }: { song: Song & { order_index: number }; index: number }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.875rem',
      padding: '0.75rem 1rem',
      background: 'rgba(22,22,26,0.85)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '0.75rem',
    }}>
      <span style={{
        width: '1.75rem', textAlign: 'right', flexShrink: 0,
        fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.18)',
      }}>
        {index}
      </span>
      <div style={{
        width: '2.25rem', height: '2.25rem', borderRadius: '0.5rem', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(252,211,77,0.1)',
      }}>
        <Music2 style={{ width: '1rem', height: '1rem', color: '#fcd34d' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {song.name}
        </p>
        {song.artist && (
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.38)', marginTop: '0.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {song.artist}
          </p>
        )}
      </div>
      <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}>
        {song.musical_key && <Chip>{song.musical_key}</Chip>}
        {song.bpm && <Chip>{song.bpm} BPM</Chip>}
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
        textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)',
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
    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.825rem', color: 'rgba(255,255,255,0.5)' }}>
      {icon}
      {children}
    </span>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      fontSize: '0.65rem', fontWeight: 600, padding: '0.15rem 0.5rem',
      borderRadius: '9999px', background: 'rgba(255,255,255,0.07)',
      color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.1)',
      whiteSpace: 'nowrap',
    }}>{children}</span>
  );
}
