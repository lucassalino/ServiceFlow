'use server';

import { createClient } from '@/lib/supabase/server';
import { APP_URL } from '@/lib/app-url';

/**
 * Gestão do token do feed .ics pessoal.
 *
 * O feed em si é servido por /api/calendar/[token] com service-role (quem o
 * lê é o Google/Apple, sem sessão). Aqui só gerimos o token, sempre com o
 * cliente do utilizador — a RLS garante que ninguém mexe no token de outro.
 */

export interface CalendarFeed {
  url: string;
  createdAt: string;
  /** Última vez que o Google/Apple leu o feed. null = ainda nunca. */
  lastUsedAt: string | null;
}

type Row = { token: string; created_at: string; last_used_at: string | null };

function toFeed(r: Row): CalendarFeed {
  return {
    url: `${APP_URL}/api/calendar/${r.token}`,
    createdAt: r.created_at,
    lastUsedAt: r.last_used_at,
  };
}

/** Token existente do utilizador nesta organização (null se ainda não criou). */
export async function fetchCalendarFeedAction(orgId: string): Promise<CalendarFeed | null> {
  const supabase = await createClient();
  // A tabela foi recriada na migração 027; os tipos gerados ainda não a têm.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase.from.bind(supabase) as any;
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');

  const { data } = await db('calendar_feed_tokens')
    .select('token, created_at, last_used_at')
    .eq('org_id', orgId).eq('user_id', user.id)
    .maybeSingle();

  return data ? toFeed(data as unknown as Row) : null;
}

/** Cria o token se ainda não existir; devolve sempre o feed. */
export async function createCalendarFeedAction(orgId: string): Promise<CalendarFeed> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase.from.bind(supabase) as any;
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');

  const existing = await fetchCalendarFeedAction(orgId);
  if (existing) return existing;

  const { data, error } = await db('calendar_feed_tokens')
    .insert({ org_id: orgId, user_id: user.id })
    .select('token, created_at, last_used_at')
    .single();
  if (error) throw new Error(error.message);

  return toFeed(data as unknown as Row);
}

/**
 * Gera um token novo, invalidando o anterior.
 * É isto que faltava à migração 012 — sem revogação, um link partilhado
 * por engano ficava válido para sempre.
 */
export async function regenerateCalendarFeedAction(orgId: string): Promise<CalendarFeed> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase.from.bind(supabase) as any;
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');

  // Apagar e recriar deixa o DEFAULT gerar novos bytes aleatórios no servidor,
  // sem termos de fabricar o segredo no lado da aplicação.
  await db('calendar_feed_tokens')
    .delete().eq('org_id', orgId).eq('user_id', user.id);

  const { data, error } = await db('calendar_feed_tokens')
    .insert({ org_id: orgId, user_id: user.id })
    .select('token, created_at, last_used_at')
    .single();
  if (error) throw new Error(error.message);

  return toFeed(data as unknown as Row);
}

/** Desativa a sincronização: apaga o token. */
export async function deleteCalendarFeedAction(orgId: string): Promise<void> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase.from.bind(supabase) as any;
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');

  const { error } = await db('calendar_feed_tokens')
    .delete().eq('org_id', orgId).eq('user_id', user.id);
  if (error) throw new Error(error.message);
}
