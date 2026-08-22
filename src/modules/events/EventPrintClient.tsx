'use client';

import Link from 'next/link';
import { ArrowLeft, Printer } from 'lucide-react';
import { useEvents } from '@/hooks/useEvents';
import { useEventMinistries, useEventSchedules, useEventSetlist, useEventTimeline } from '@/hooks/useSchedule';
import { useOrgStore } from '@/stores/orgStore';
import { formatDate, formatTime } from '@/lib/utils';
import { getFunctionLabel } from '@/lib/constants';
import type { EventMinistry, Ministry, Song } from '@/types/models';

/**
 * A folha impressa é sempre branca, mesmo com a app em tema escuro — as
 * cores do texto aqui são por isso fixas, nunca `var(--wis-text*)` (essas
 * mudam com o tema e ficavam quase ilegíveis sobre o papel branco).
 */
const PRINT_TEXT = '#18181b';
const PRINT_TEXT_3 = '#71717a';
const PRINT_BORDER = '#e4e4e7';

interface Props { orgId: string; eventId: string }

export function EventPrintClient({ orgId, eventId }: Props) {
  const { activeOrg } = useOrgStore();
  const { data: events = [], isLoading: eventsLoading } = useEvents();
  const event = events.find((e) => e.id === eventId) ?? null;

  const { data: eventMinistries = [] } = useEventMinistries(event?.id ?? null);
  const { data: setlist = [] } = useEventSetlist(event?.id ?? null);
  const { data: timeline = [] } = useEventTimeline(event?.id ?? null);

  if (eventsLoading) {
    return (
      <div className="dash-purple-bg" style={{ minHeight: '100vh', padding: '2rem', color: 'var(--wis-text-2)' }}>
        A carregar…
      </div>
    );
  }

  if (!event) {
    return (
      <div className="dash-purple-bg" style={{ minHeight: '100vh', padding: '2rem' }}>
        <p style={{ marginBottom: '0.75rem', color: 'var(--wis-text-2)' }}>Evento não encontrado.</p>
        <Link href={`/${orgId}/events`} style={{ color: 'var(--wis-text)' }}>Voltar aos eventos</Link>
      </div>
    );
  }

  return (
    <div className="dash-purple-bg" style={{ minHeight: '100vh' }}>
      {/* Barra de ações — não sai impressa */}
      <div className="no-print" style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '1rem 1.5rem', borderBottom: '1px solid var(--wis-border)',
        background: 'var(--wis-surface)', backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <Link href={`/${orgId}/events?event=${event.id}`} style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
          fontSize: '0.85rem', color: 'var(--wis-text-2)', textDecoration: 'none',
        }}>
          <ArrowLeft size={16} /> Voltar ao evento
        </Link>
        <button onClick={() => window.print()} className="dark-primary-btn">
          <Printer size={16} /> Imprimir / Guardar PDF
        </button>
      </div>

      {/* Folha imprimível — mantém-se branca (é o que sai no PDF) */}
      <div id="print-area" style={{
        maxWidth: '780px', margin: '2rem auto', padding: '2.5rem 2rem',
        background: '#ffffff', color: '#18181b', fontFamily: 'system-ui, sans-serif',
        borderRadius: '0.75rem', boxShadow: 'var(--wis-shadow-md)',
      }}>
        <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: PRINT_TEXT_3 }}>
          {activeOrg?.name ?? 'Roteiro do evento'}
        </p>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0.25rem 0 0.5rem', color: PRINT_TEXT }}>{event.name}</h1>
        <p style={{ fontSize: '0.9rem', color: PRINT_TEXT, marginBottom: '1.75rem' }}>
          {formatDate(event.date)}
          {event.time && ` · ${formatTime(event.time)}`}
          {event.location && ` · ${event.location}`}
          {event.arrival_time && ` · Chegada da equipa: ${formatTime(event.arrival_time)}`}
        </p>

        {timeline.length > 0 && (
          <PrintSection title="Roteiro">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <tbody>
                {timeline.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: `1px solid ${PRINT_BORDER}` }}>
                    <td style={{ padding: '0.4rem 0.5rem 0.4rem 0', fontWeight: 700, width: '3.5rem', color: PRINT_TEXT }}>
                      {formatTime(item.time)}
                    </td>
                    <td style={{ padding: '0.4rem 0', color: PRINT_TEXT }}>{item.title}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </PrintSection>
        )}

        {eventMinistries.length > 0 && (
          <PrintSection title="Ministérios & Equipa">
            {(eventMinistries as (EventMinistry & { ministry: Ministry })[]).map((em) => (
              <PrintMinistryBlock key={em.id} em={em} />
            ))}
          </PrintSection>
        )}

        {setlist.length > 0 && (
          <PrintSection title="Setlist">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <tbody>
                {(setlist as (Song & { order_index: number; event_key: string | null; event_note: string | null })[]).map((song, idx) => (
                  <tr key={song.id} style={{ borderBottom: `1px solid ${PRINT_BORDER}` }}>
                    <td style={{ padding: '0.4rem 0.5rem 0.4rem 0', color: PRINT_TEXT_3, width: '1.5rem' }}>
                      {idx + 1}
                    </td>
                    <td style={{ padding: '0.4rem 0', color: PRINT_TEXT }}>
                      <span style={{ fontWeight: 600 }}>{song.name}</span>
                      {song.artist && <span style={{ color: PRINT_TEXT_3 }}> — {song.artist}</span>}
                      {song.event_note && (
                        <div style={{ fontSize: '0.75rem', color: '#b45309', marginTop: '0.1rem' }}>
                          {song.event_note}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '0.4rem 0', textAlign: 'right', color: PRINT_TEXT }}>
                      {(song.event_key ?? song.musical_key) || ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </PrintSection>
        )}
      </div>
    </div>
  );
}

function PrintSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '1.75rem', breakInside: 'avoid' }}>
      <p style={{
        fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
        color: PRINT_TEXT_3, marginBottom: '0.5rem', borderBottom: `2px solid ${PRINT_BORDER}`, paddingBottom: '0.25rem',
      }}>
        {title}
      </p>
      {children}
    </div>
  );
}

function PrintMinistryBlock({ em }: { em: EventMinistry & { ministry: Ministry } }) {
  const { data: schedules = [] } = useEventSchedules(em.id);
  return (
    <div style={{ marginBottom: '0.75rem', breakInside: 'avoid' }}>
      <p style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.25rem', color: PRINT_TEXT }}>{em.ministry.name}</p>
      {schedules.length === 0 ? (
        <p style={{ fontSize: '0.8rem', color: PRINT_TEXT_3 }}>Ninguém escalado.</p>
      ) : (
        <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.85rem', color: PRINT_TEXT }}>
          {schedules.map((s) => (
            <li key={s.id} style={{ marginBottom: '0.15rem' }}>
              {s.profile?.full_name ?? s.user_id}
              {s.functions.length > 0 && (
                <span style={{ color: PRINT_TEXT_3 }}> — {s.functions.map(getFunctionLabel).join(', ')}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
