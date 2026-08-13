'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, MapPin, Check, X, Minus, Music2, Youtube, ExternalLink, Users, ListMusic, Timer, Printer, CalendarPlus, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  useEventMinistries,
  useEventSchedules,
  useEventSetlist,
  useEventTimeline,
  useConfirmSchedule,
  useReorderEventSetlist,
} from '@/hooks/useSchedule';
import { getFunctionLabel } from '@/lib/constants';
import { formatDate, formatTime, getInitials, eventPeriod } from '@/lib/utils';
import { downloadEventICS } from '@/lib/ics';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useOrgStore } from '@/stores/orgStore';
import type { Event, EventMinistry, Ministry, EventSchedule, Song } from '@/types/models';
import { SongDetailPanel } from '@/modules/songs/SongDetailPanel';

interface Props {
  event: Event;
  onBack: () => void;
  isAdmin: boolean;
  canReorderSetlist?: boolean;
  onEdit: () => void;
}

export function EventDetailPanel({ event, onBack, isAdmin, canReorderSetlist = false, onEdit }: Props) {
  const { activeMembership, activeOrg } = useOrgStore();
  const currentUserId = activeMembership?.user_id;
  const [tab, setTab] = useState<'team' | 'setlist' | 'roteiro'>('team');
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);

  const { data: eventMinistries = [], isLoading: ministriesLoading } = useEventMinistries(event.id);
  const { data: setlist = [], isLoading: setlistLoading } = useEventSetlist(event.id);
  const { data: timeline = [], isLoading: timelineLoading } = useEventTimeline(event.id);
  const reorderSetlist = useReorderEventSetlist();

  const setlistSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
  );

  function handleSetlistDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = (setlist as (Song & { order_index: number })[]).map((s) => s.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    reorderSetlist.mutate({ eventId: event.id, orderedSongIds: arrayMove(ids, oldIndex, newIndex) });
  }

  const color = event.color ?? '#a5b4fc';

  if (selectedSong) {
    return (
      <SongDetailPanel
        song={selectedSong}
        eventNote={(selectedSong as Song & { event_note?: string | null }).event_note}
        onBack={() => setSelectedSong(null)}
        isAdmin={false}
        onEdit={() => {}}
        onDelete={() => {}}
      />
    );
  }

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
            Eventos
          </button>

          {isAdmin && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {activeOrg?.id && (
                <Link href={`/${activeOrg.id}/events/${event.id}/print`} target="_blank" rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                    padding: '0.375rem 0.875rem',
                    fontSize: '0.775rem', fontWeight: 500,
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '0.5rem',
                    color: 'rgba(255,255,255,0.7)', cursor: 'pointer', textDecoration: 'none',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
                >
                  <Printer style={{ width: '0.8rem', height: '0.8rem' }} />
                  Exportar
                </Link>
              )}
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
            </div>
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

        {/* ── Tabs ───────────────────────────────────── */}
        <div>
          {/* Tab bar */}
          <div style={{
            display: 'flex', gap: '0.25rem',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            marginBottom: '1.25rem',
          }}>
            {([
              { key: 'team', label: 'Ministérios & Equipa', icon: <Users style={{ width: '0.875rem', height: '0.875rem' }} />, count: eventMinistries.length },
              { key: 'setlist', label: 'Setlist', icon: <ListMusic style={{ width: '0.875rem', height: '0.875rem' }} />, count: setlist.length },
              { key: 'roteiro', label: 'Roteiro', icon: <Clock style={{ width: '0.875rem', height: '0.875rem' }} />, count: timeline.length },
            ] as const).map(({ key, label, icon, count }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.5rem 0.875rem',
                  fontSize: '0.8rem', fontWeight: tab === key ? 600 : 400,
                  color: tab === key ? '#fff' : 'rgba(255,255,255,0.4)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  borderBottom: `2px solid ${tab === key ? '#fff' : 'transparent'}`,
                  marginBottom: '-1px',
                  transition: 'color 0.12s',
                  whiteSpace: 'nowrap',
                }}
              >
                {icon}
                {label}
                {count > 0 && (
                  <span style={{
                    fontSize: '0.65rem', fontWeight: 700,
                    padding: '0.1rem 0.4rem',
                    borderRadius: '9999px',
                    background: tab === key ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.07)',
                    color: tab === key ? '#fff' : 'rgba(255,255,255,0.4)',
                  }}>
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab: Ministérios & Equipa */}
          {tab === 'team' && (
            ministriesLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} style={{ height: '5rem', borderRadius: '0.875rem', background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                ))}
              </div>
            ) : eventMinistries.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', borderRadius: '0.875rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Users style={{ width: '2rem', height: '2rem', color: 'rgba(255,255,255,0.15)', margin: '0 auto 0.75rem' }} />
                <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.3)' }}>
                  Nenhum ministério atribuído a este evento.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {(eventMinistries as (EventMinistry & { ministry: Ministry })[]).map((em) => (
                  <MinistrySection key={em.id} em={em} currentUserId={currentUserId} event={event} />
                ))}
              </div>
            )
          )}

          {/* Tab: Setlist */}
          {tab === 'setlist' && (
            setlistLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} style={{ height: '3rem', borderRadius: '0.625rem', background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                ))}
              </div>
            ) : setlist.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', borderRadius: '0.875rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <ListMusic style={{ width: '2rem', height: '2rem', color: 'rgba(255,255,255,0.15)', margin: '0 auto 0.75rem' }} />
                <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.3)' }}>
                  Nenhuma música no setlist.
                </p>
                {isAdmin && (
                  <button onClick={onEdit} style={{
                    marginTop: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                    padding: '0.4rem 0.875rem', fontSize: '0.8rem', fontWeight: 500,
                    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '0.5rem', color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
                  }}>
                    Editar evento para adicionar músicas
                  </button>
                )}
              </div>
            ) : (
              <>
                {canReorderSetlist ? (
                  <DndContext sensors={setlistSensors} collisionDetection={closestCenter} onDragEnd={handleSetlistDragEnd}>
                    <SortableContext
                      items={(setlist as (Song & { order_index: number })[]).map((s) => s.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                        {(setlist as (Song & { order_index: number; event_key: string | null; event_note: string | null })[]).map((song, idx) => (
                          <SortableSetlistRow key={song.id} id={song.id} song={song} index={idx + 1} onClick={() => setSelectedSong(song)} />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                    {(setlist as (Song & { order_index: number; event_key: string | null; event_note: string | null })[]).map((song, idx) => (
                      <SetlistRow key={song.id} song={song} index={idx + 1} onClick={() => setSelectedSong(song)} />
                    ))}
                  </div>
                )}
                <YoutubePlaylistButton songs={setlist as Song[]} />
              </>
            )
          )}

          {/* Tab: Roteiro */}
          {tab === 'roteiro' && (
            timelineLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} style={{ height: '3rem', borderRadius: '0.625rem', background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                ))}
              </div>
            ) : timeline.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', borderRadius: '0.875rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Clock style={{ width: '2rem', height: '2rem', color: 'rgba(255,255,255,0.15)', margin: '0 auto 0.75rem' }} />
                <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.3)' }}>
                  Nenhum momento definido para este evento.
                </p>
                {isAdmin && (
                  <button onClick={onEdit} style={{
                    marginTop: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                    padding: '0.4rem 0.875rem', fontSize: '0.8rem', fontWeight: 500,
                    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '0.5rem', color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
                  }}>
                    Editar evento para adicionar o roteiro
                  </button>
                )}
              </div>
            ) : (
              <div style={{ borderRadius: '0.875rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                {timeline.map((item, idx) => (
                  <div key={idx} style={{
                    display: 'flex', alignItems: 'center', gap: '0.875rem',
                    padding: '0.75rem 1.125rem',
                    borderBottom: idx < timeline.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', width: '3.25rem', flexShrink: 0 }}>
                      {formatTime(item.time)}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>{item.title}</span>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

      </div>
    </div>
  );
}

// ── Hero content ─────────────────────────────────────────────────────────────

function HeroContent({ event }: { event: Event }) {
  return (
    <>
      <div style={{ marginBottom: '0.5rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        <span style={{
          fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.6rem',
          borderRadius: '9999px', letterSpacing: '0.1em', textTransform: 'uppercase',
          background: event.is_published ? 'rgba(110,231,183,0.2)' : 'rgba(255,255,255,0.08)',
          color: event.is_published ? '#6ee7b7' : 'rgba(255,255,255,0.4)',
          border: `1px solid ${event.is_published ? 'rgba(110,231,183,0.3)' : 'rgba(255,255,255,0.1)'}`,
        }}>
          {event.is_published ? 'Publicado' : 'Rascunho'}
        </span>
        {(() => {
          const p = eventPeriod(event.time);
          if (!p) return null;
          return (
            <span style={{
              fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.6rem',
              borderRadius: '9999px', letterSpacing: '0.06em', textTransform: 'uppercase',
              background: 'rgba(165,180,252,0.15)', color: '#a5b4fc',
              border: '1px solid rgba(165,180,252,0.25)',
            }}>
              {p.emoji} {p.label}
            </span>
          );
        })()}
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
        {event.arrival_time && (
          <MetaItem icon={<Timer style={{ width: '0.8rem', height: '0.8rem' }} />}>
            Chegada {formatTime(event.arrival_time)}
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
  em, currentUserId, event,
}: {
  em: EventMinistry & { ministry: Ministry };
  currentUserId: string | undefined;
  event: Event;
}) {
  const { data: schedules = [], isLoading } = useEventSchedules(em.id);
  const confirmSchedule = useConfirmSchedule();
  const color = em.ministry.color ?? '#a5b4fc';
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  const confirmedCount = schedules.filter((s) => s.confirmed === true).length;

  async function handleConfirm(schedule: EventSchedule) {
    if (schedule.user_id !== currentUserId) return;
    const next = schedule.confirmed !== true;
    try {
      await confirmSchedule.mutateAsync({ id: schedule.id, eventMinistryId: em.id, confirmed: next });
      if (next) setSaveDialogOpen(true);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro');
    }
  }

  return (
    <>
    <div style={{
      background: 'rgba(22,22,26,0.85)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '0.875rem', overflow: 'hidden',
    }}>
      {/* Ministry header */}
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: '0.75rem 1.125rem',
        borderBottom: schedules.length > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
        borderLeft: `3px solid ${color}`,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fff' }}>{em.ministry.name}</p>
          {!isLoading && (
            <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.1rem' }}>
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
              display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.625rem 0.875rem',
              padding: '0.75rem 1.125rem',
              borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.04)',
            }}>
              <Avatar style={{ width: '2.25rem', height: '2.25rem', flexShrink: 0 }}>
                <AvatarFallback style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}>
                  {getInitials(name)}
                </AvatarFallback>
              </Avatar>

              <div style={{ flex: '1 1 8rem', minWidth: 0 }}>
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
                        {getFunctionLabel(fn)}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Confirmação de presença */}
              <ConfirmControl
                schedule={schedule}
                isMe={isMe}
                isPending={confirmSchedule.isPending}
                onToggle={() => handleConfirm(schedule)}
                event={event}
              />
            </div>
          );
        })
      )}
    </div>

    <AlertDialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Guardar evento no calendário?</AlertDialogTitle>
          <AlertDialogDescription>
            Presença confirmada em &quot;{event.name}&quot;. Queres adicionar este evento ao calendário do teu telemóvel (Google Calendar, Calendário da Apple, etc.)?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Agora não</AlertDialogCancel>
          <AlertDialogAction onClick={() => downloadEventICS(event)}>
            Guardar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}

// ── Confirmação de presença ────────────────────────────────────────────────────

function ConfirmControl({
  schedule, isMe, isPending, onToggle, event,
}: {
  schedule: EventSchedule;
  isMe: boolean;
  isPending: boolean;
  onToggle: () => void;
  event: Event;
}) {
  const confirmed = schedule.confirmed;

  // Quem NÃO é a pessoa escalada: só vê o estado, sem poder alterar.
  if (!isMe) {
    const label = confirmed === true ? 'Confirmado' : confirmed === false ? 'Recusou' : 'Por confirmar';
    const fg = confirmed === true ? '#6ee7b7' : confirmed === false ? '#f87171' : 'rgba(255,255,255,0.35)';
    const bg = confirmed === true ? 'rgba(110,231,183,0.12)' : confirmed === false ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.05)';
    const border = confirmed === true ? 'rgba(110,231,183,0.25)' : confirmed === false ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.1)';
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0,
        padding: '0.3rem 0.7rem', borderRadius: '9999px',
        fontSize: '0.72rem', fontWeight: 600,
        color: fg, background: bg, border: `1px solid ${border}`,
        whiteSpace: 'nowrap',
      }}>
        {confirmed === true ? <Check style={{ width: '0.75rem', height: '0.75rem' }} />
          : confirmed === false ? <X style={{ width: '0.75rem', height: '0.75rem' }} />
          : <Minus style={{ width: '0.75rem', height: '0.75rem' }} />}
        {label}
      </span>
    );
  }

  // A própria pessoa: botão interativo com texto claro.
  const isConfirmed = confirmed === true;
  const label = isConfirmed ? 'Presença confirmada' : 'Confirmar presença';
  const fg = isConfirmed ? '#6ee7b7' : '#0a0a0e';
  const bg = isConfirmed ? 'rgba(110,231,183,0.15)' : '#fff';
  const border = isConfirmed ? 'rgba(110,231,183,0.3)' : 'transparent';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end',
      gap: '0.5rem', flexShrink: 0, marginLeft: 'auto',
    }}>
      {isConfirmed && (
        <button
          onClick={() => downloadEventICS(event)}
          title="Descarregar ficheiro .ics para adicionar ao Google Calendar, Apple Calendar ou Outlook"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            padding: '0.45rem 0.7rem', borderRadius: '9999px',
            fontSize: '0.75rem', fontWeight: 600,
            color: 'rgba(255,255,255,0.75)', background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.14)',
            cursor: 'pointer', whiteSpace: 'nowrap', transition: 'background 0.12s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
        >
          <CalendarPlus style={{ width: '0.85rem', height: '0.85rem' }} />
          Adicionar ao calendário
        </button>
      )}
      <button
        disabled={isPending}
        onClick={onToggle}
        title={isConfirmed ? 'Clique para cancelar a confirmação' : 'Clique para confirmar a tua presença'}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0,
          padding: '0.45rem 0.9rem', borderRadius: '9999px',
          fontSize: '0.75rem', fontWeight: 600,
          color: fg, background: bg, border: `1px solid ${border}`,
          cursor: isPending ? 'wait' : 'pointer',
          opacity: isPending ? 0.6 : 1,
          whiteSpace: 'nowrap',
          transition: 'background 0.12s, opacity 0.12s, transform 0.1s',
        }}
        onMouseEnter={(e) => { if (!isPending) e.currentTarget.style.transform = 'translateY(-1px)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
      >
        {isConfirmed ? <Check style={{ width: '0.85rem', height: '0.85rem' }} /> : null}
        {label}
      </button>
    </div>
  );
}

// ── Setlist row ───────────────────────────────────────────────────────────────

function SortableSetlistRow({ id, song, index, onClick }: {
  id: string; song: Song & { order_index: number; event_key?: string | null; event_note?: string | null };
  index: number; onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform), transition,
        opacity: isDragging ? 0.6 : 1, position: 'relative', zIndex: isDragging ? 1 : 'auto',
      }}
    >
      <SetlistRow
        song={song}
        index={index}
        onClick={onClick}
        dragHandle={
          <button
            type="button"
            {...attributes}
            {...listeners}
            aria-label="Arrastar para reordenar"
            onClick={(e) => e.stopPropagation()}
            style={{
              display: 'flex', alignItems: 'center', flexShrink: 0, color: 'rgba(255,255,255,0.3)',
              background: 'none', border: 'none', padding: '0.25rem', cursor: 'grab', touchAction: 'none',
            }}
          >
            <GripVertical style={{ width: '0.9rem', height: '0.9rem' }} />
          </button>
        }
      />
    </div>
  );
}

function SetlistRow({ song, index, onClick, dragHandle }: {
  song: Song & { order_index: number; event_key?: string | null; event_note?: string | null };
  index: number; onClick: () => void; dragHandle?: React.ReactNode;
}) {
  const key = song.event_key ?? song.musical_key;
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.875rem',
        padding: '0.75rem 1rem',
        background: 'rgba(22,22,26,0.85)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '0.75rem',
        cursor: 'pointer',
        transition: 'background 0.12s, border-color 0.12s',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = 'rgba(40,40,50,0.95)';
        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.14)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = 'rgba(22,22,26,0.85)';
        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)';
      }}
    >
      {dragHandle}
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
        {song.event_note && (
          <p style={{
            fontSize: '0.72rem', color: '#fcd34d', marginTop: '0.2rem', lineHeight: 1.4,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {song.event_note}
          </p>
        )}
      </div>
      <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}>
        {key && <Chip>{key}</Chip>}
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

// ── YouTube playlist button ───────────────────────────────────────────────────

function extractYoutubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1).split('?')[0];
    return u.searchParams.get('v');
  } catch {
    return null;
  }
}

function YoutubePlaylistButton({ songs }: { songs: Song[] }) {
  const ids = songs
    .filter((s) => !!s.youtube_url)
    .map((s) => extractYoutubeId(s.youtube_url!))
    .filter((id): id is string => !!id);

  if (ids.length === 0) return null;

  const playlistUrl =
    ids.length === 1
      ? `https://www.youtube.com/watch?v=${ids[0]}`
      : `https://www.youtube.com/watch_videos?video_ids=${ids.join(',')}`;

  return (
    <div style={{ marginTop: '0.875rem' }}>
      <a
        href={playlistUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.625rem 1.125rem',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '0.625rem',
          color: 'rgba(255,255,255,0.85)',
          fontSize: '0.825rem', fontWeight: 600,
          textDecoration: 'none',
          transition: 'background 0.15s, transform 0.12s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'none'; }}
      >
        <Youtube style={{ width: '1rem', height: '1rem', color: '#f87171' }} />
        Abrir playlist no YouTube
        <span style={{ fontSize: '0.72rem', opacity: 0.5 }}>({ids.length} música{ids.length !== 1 ? 's' : ''})</span>
        <ExternalLink style={{ width: '0.75rem', height: '0.75rem', opacity: 0.5 }} />
      </a>
    </div>
  );
}
