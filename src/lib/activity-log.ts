/**
 * Histórico de alterações a um evento — quem mudou o quê e quando.
 * Ver migração 042 (`event_activity_log`).
 *
 * As mensagens já vêm prontas ("removeu Alex de Louvor") de quem chama —
 * é aqui que resolvem o nome de quem fez a ação e gravam. Nunca lança: o
 * histórico é informativo, uma falha a escrever não pode desfazer nem
 * bloquear a ação principal que já aconteceu.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

export async function logEventActivity(
  supabase: AnyClient,
  orgId: string,
  eventId: string,
  actorId: string,
  messages: string[],
): Promise<void> {
  if (messages.length === 0) return;
  try {
    const { data: profile } = await supabase
      .from('profiles').select('full_name').eq('id', actorId).maybeSingle();
    const actorName = (profile as { full_name?: string } | null)?.full_name ?? 'Alguém';
    const rows = messages.map((message) => ({
      org_id: orgId, event_id: eventId, actor_id: actorId, actor_name: actorName, message,
    }));
    const { error } = await supabase.from('event_activity_log').insert(rows);
    if (error) console.error('event_activity_log:', error.message);
  } catch (err) {
    console.error('event_activity_log:', err);
  }
}

export async function fetchMinistryName(supabase: AnyClient, ministryId: string): Promise<string> {
  const { data } = await supabase.from('ministries').select('name').eq('id', ministryId).maybeSingle();
  return (data as { name?: string } | null)?.name ?? 'um ministério';
}

export async function fetchPersonName(supabase: AnyClient, userId: string): Promise<string> {
  const { data } = await supabase.from('profiles').select('full_name').eq('id', userId).maybeSingle();
  return (data as { full_name?: string } | null)?.full_name ?? 'alguém';
}
