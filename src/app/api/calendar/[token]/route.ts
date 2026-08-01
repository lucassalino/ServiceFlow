import { createClient } from '@supabase/supabase-js';
import { buildFeedICS, type FeedEvent } from '@/lib/ics';

/**
 * Feed .ics pessoal, para subscrever no Google/Apple Calendar.
 *
 * É chamado pelos servidores da Google/Apple, SEM sessão — o segredo é o
 * próprio token no URL. Por isso usa service-role (ignora RLS) e o middleware
 * tem de deixar esta rota passar sem autenticação (ver src/lib/supabase/middleware.ts).
 *
 * Devolve apenas os eventos em que a pessoa está escalada nesta organização.
 */

export const dynamic = 'force-dynamic';

/* eslint-disable @typescript-eslint/no-explicit-any */
function getAdmin(): any {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

function notFound(): Response {
  // Resposta deliberadamente vaga: não revelamos se o token existiu alguma vez.
  return new Response('Calendário não encontrado.', {
    status: 404,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  if (!token || token.length < 20) return notFound();

  const admin = getAdmin();

  const { data: feed } = await admin
    .from('calendar_feed_tokens')
    .select('id, org_id, user_id, organizations(name)')
    .eq('token', token)
    .maybeSingle();

  if (!feed) return notFound();

  const orgName = (feed.organizations as { name?: string } | null)?.name ?? 'Escalas';

  // Eventos em que a pessoa está escalada, nesta organização.
  // Limitamos aos últimos 6 meses para o feed não crescer sem fim — os
  // clientes de calendário releem isto de forma recorrente.
  const since = new Date();
  since.setMonth(since.getMonth() - 6);
  const sinceISO = since.toISOString().slice(0, 10);

  const { data: rows } = await admin
    .from('event_schedules')
    .select(`
      functions,
      event_ministries!inner(
        ministries(name),
        events!inner(id, org_id, name, date, time, location, description)
      )
    `)
    .eq('user_id', feed.user_id);

  type Row = {
    functions: string[] | null;
    event_ministries: {
      ministries: { name: string } | null;
      events: {
        id: string; org_id: string; name: string; date: string;
        time: string | null; location: string | null; description: string | null;
      } | null;
    } | null;
  };

  // Agrupa por evento: a mesma pessoa pode servir em vários ministérios no
  // mesmo evento e queremos UMA entrada no calendário, não várias.
  const byEvent = new Map<string, FeedEvent>();

  for (const r of ((rows ?? []) as unknown as Row[])) {
    const ev = r.event_ministries?.events;
    if (!ev || ev.org_id !== feed.org_id || !ev.time) continue;
    if (ev.date < sinceISO) continue;

    let entry = byEvent.get(ev.id);
    if (!entry) {
      entry = {
        id: ev.id,
        name: ev.name,
        date: ev.date,
        time: ev.time,
        location: ev.location,
        description: ev.description,
        roles: [],
      };
      byEvent.set(ev.id, entry);
    }
    const ministry = r.event_ministries?.ministries?.name;
    if (ministry) {
      entry.roles.push({ ministry, functions: r.functions ?? [] });
    }
  }

  const events = [...byEvent.values()].sort((a, b) => a.date.localeCompare(b.date));
  const ics = buildFeedICS(events, `${orgName} — as minhas escalas`);

  // Marca a utilização (best-effort: não deve impedir a resposta).
  admin.from('calendar_feed_tokens')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', feed.id)
    .then(undefined, () => { /* ignorado de propósito */ });

  return new Response(ics, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="escalas.ics"',
      // Os clientes de calendário releem periodicamente; uma hora chega.
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
