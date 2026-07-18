import type { Event } from '@/types/models';

const EVENT_DURATION_HOURS = 2;

function escapeICS(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

/** Quebra linhas a cada 75 octetos, como pede o RFC 5545 (continuação começa com um espaço). */
function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const parts: string[] = [];
  let rest = line;
  while (rest.length > 75) {
    parts.push(rest.slice(0, 75));
    rest = ' ' + rest.slice(75);
  }
  parts.push(rest);
  return parts.join('\r\n');
}

function toICSDateTime(date: string, time: string): string {
  const [h, m] = time.split(':');
  return `${date.replace(/-/g, '')}T${h.padStart(2, '0')}${m.padStart(2, '0')}00`;
}

function addHours(date: string, time: string, hours: number): string {
  const d = new Date(`${date}T${time}:00`);
  d.setHours(d.getHours() + hours);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
}

function nowStamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

/** Gera o conteúdo de um ficheiro .ics (RFC 5545) com um único evento. */
export function buildEventICS(event: Event): string {
  const descriptionParts = [event.description, event.observations].filter(Boolean) as string[];
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//WIS Services//Calendario//PT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.id}@wis-services.com`,
    `DTSTAMP:${nowStamp()}`,
    `DTSTART:${toICSDateTime(event.date, event.time)}`,
    `DTEND:${addHours(event.date, event.time, EVENT_DURATION_HOURS)}`,
    `SUMMARY:${escapeICS(event.name)}`,
  ];
  if (event.location) lines.push(`LOCATION:${escapeICS(event.location)}`);
  if (descriptionParts.length > 0) lines.push(`DESCRIPTION:${escapeICS(descriptionParts.join('\n'))}`);
  lines.push('END:VEVENT', 'END:VCALENDAR');
  return lines.map(foldLine).join('\r\n') + '\r\n';
}

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); // iPadOS reporta-se como Mac
}

/**
 * Guarda o evento no calendário do telemóvel.
 * No iOS/Safari, navegar diretamente para o .ics (em vez de forçar download) abre logo o ecrã
 * "Adicionar evento" do Calendário da Apple. Nos outros browsers não há esse atalho — descarrega-se
 * o ficheiro normalmente e o sistema pergunta com que app abrir (normalmente o Google Calendar).
 */
export function downloadEventICS(event: Event): void {
  const ics = buildEventICS(event);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  if (isIOS()) {
    window.location.href = url;
    return;
  }

  const a = document.createElement('a');
  a.href = url;
  a.download = `${event.name.replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'evento'}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
