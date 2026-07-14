import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, opts?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit', month: '2-digit', year: 'numeric', ...opts,
  }).format(typeof date === 'string' ? new Date(date) : date);
}

export function formatTime(time: string): string {
  return time.slice(0, 5);
}

export function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
}

/**
 * Copia texto para a área de transferência de forma robusta.
 * A API `navigator.clipboard` só existe em contextos seguros (HTTPS ou localhost);
 * em HTTP (ex.: aceder pelo IP da rede no telemóvel) cai para o método legacy.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // ignora e tenta o fallback
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    ta.style.top = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

/**
 * Período do dia de um evento, derivado da hora ("HH:MM" ou "HH:MM:SS").
 * Manhã 05:00–11:59 · Tarde 12:00–17:59 · Noite 18:00–04:59.
 */
export function eventPeriod(time: string | null | undefined): { label: string; emoji: string } | null {
  if (!time) return null;
  const hour = parseInt(time.slice(0, 2), 10);
  if (Number.isNaN(hour)) return null;
  if (hour >= 5 && hour < 12) return { label: 'Manhã', emoji: '🌅' };
  if (hour >= 12 && hour < 18) return { label: 'Tarde', emoji: '☀️' };
  return { label: 'Noite', emoji: '🌙' };
}
