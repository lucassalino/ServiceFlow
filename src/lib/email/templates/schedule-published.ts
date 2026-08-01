import {
  renderLayout, textFooter, escapeHtml, APP_NAME, APP_URL,
} from './layout';

export interface SchedulePublishedData {
  /** Primeiro nome de quem recebe. */
  name: string;
  eventName: string;
  /** ISO YYYY-MM-DD */
  eventDate: string;
  /** HH:MM ou null */
  eventTime: string | null;
  location: string | null;
  /** Ministério(s) e funções em que a pessoa foi escalada. */
  assignments: { ministry: string; functions: string[] }[];
  orgId: string;
  eventId: string;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('pt-PT', {
    weekday: 'long', day: 'numeric', month: 'long',
  }).format(new Date(`${iso}T00:00:00`));
}

export function renderSchedulePublished(d: SchedulePublishedData): RenderedEmail {
  const when = formatDate(d.eventDate) + (d.eventTime ? ` às ${d.eventTime.slice(0, 5)}` : '');
  const url = `${APP_URL}/${d.orgId}/events?event=${d.eventId}`;

  const rows = d.assignments
    .map((a) => {
      const fns = a.functions.length ? ` — ${a.functions.join(', ')}` : '';
      return `<li style="margin:0 0 4px;">${escapeHtml(a.ministry)}${escapeHtml(fns)}</li>`;
    })
    .join('');

  const body = `
    <p style="margin:0 0 14px;">Olá ${escapeHtml(d.name)},</p>
    <p style="margin:0 0 18px;">
      Foste escalado(a) para <strong>${escapeHtml(d.eventName)}</strong>.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#f8fafc;border-radius:8px;padding:14px 16px;margin:0 0 16px;">
      <tr><td style="font-size:14px;line-height:1.7;color:#1c1c22;">
        <strong>Quando:</strong> ${escapeHtml(when)}<br>
        ${d.location ? `<strong>Onde:</strong> ${escapeHtml(d.location)}<br>` : ''}
        <strong>Onde serves:</strong>
        <ul style="margin:6px 0 0;padding-left:18px;">${rows}</ul>
      </td></tr>
    </table>
    <p style="margin:0;color:#6b7280;font-size:14px;">
      Confirma a tua presença na app para a equipa saber que contas.
    </p>`;

  const text = [
    `Olá ${d.name},`,
    '',
    `Foste escalado(a) para "${d.eventName}".`,
    '',
    `Quando: ${when}`,
    d.location ? `Onde: ${d.location}` : null,
    'Onde serves:',
    ...d.assignments.map((a) =>
      `  - ${a.ministry}${a.functions.length ? ` — ${a.functions.join(', ')}` : ''}`),
    '',
    `Confirma a tua presença: ${url}`,
    textFooter(),
  ]
    .filter((l) => l !== null)
    .join('\n');

  return {
    subject: `${d.eventName} — ${formatDate(d.eventDate)} · ${APP_NAME}`,
    html: renderLayout({
      title: `Foste escalado(a) para ${d.eventName}`,
      body,
      cta: { label: 'Confirmar presença', url },
    }),
    text,
  };
}
