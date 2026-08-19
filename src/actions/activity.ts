'use server';

import { createClient } from '@/lib/supabase/server';
import type { EventActivityLogEntry } from '@/types/models';

/**
 * Histórico de alterações de um evento. A RLS ("event_activity_log:
 * admins/leaders can read") já restringe a quem administra ou lidera —
 * um membro comum recebe lista vazia, não erro.
 */
export async function fetchEventActivityAction(eventId: string): Promise<EventActivityLogEntry[]> {
  const supabase = await createClient();
  // `event_activity_log` é da migração 042, ainda não presente nos tipos
  // gerados do Supabase — cast local, ver AGENTS.md.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).from('event_activity_log')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return data as EventActivityLogEntry[];
}
