/**
 * Enforcement do "só leitura" quando uma org está `downgraded_locked`
 * (cancelou/expirou e ficou acima dos limites do Semente). O admin escolhe
 * até 1 ministério + 10 pessoas para continuarem operacionais
 * (`organizations.active_ministry_ids`/`active_member_ids` — ver
 * DowngradeLockScreen / actions/downgrade.ts); tudo o resto fica bloqueado
 * para escrita, sem apagar dados.
 *
 * `active_member_ids` guarda `organization_members.id`, não o `user_id` do
 * auth/profile — por isso há duas variantes do guard de pessoa.
 */

const LOCK_MESSAGE =
  'A tua organização está com o plano despromovido e este recurso não está entre os escolhidos para continuar ativo. ' +
  'Escolhe outro em Definições ou faz upgrade do plano para voltar a editar tudo.';

export interface DowngradeLockInfo {
  locked: boolean;
  ministryIds: string[];
  memberIds: string[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getDowngradeLockInfo(supabase: any, orgId: string): Promise<DowngradeLockInfo> {
  const { data: sub } = await supabase.from('org_subscriptions').select('status').eq('org_id', orgId).single();
  if (sub?.status !== 'downgraded_locked') return { locked: false, ministryIds: [], memberIds: [] };

  const { data: org } = await supabase.from('organizations')
    .select('active_ministry_ids, active_member_ids').eq('id', orgId).single();
  return {
    locked: true,
    ministryIds: org?.active_ministry_ids ?? [],
    memberIds: org?.active_member_ids ?? [],
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function assertMinistryUnlocked(supabase: any, orgId: string, ministryId: string): Promise<void> {
  const lock = await getDowngradeLockInfo(supabase, orgId);
  if (lock.locked && !lock.ministryIds.includes(ministryId)) throw new Error(LOCK_MESSAGE);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function assertMemberUnlockedById(supabase: any, orgId: string, memberId: string): Promise<void> {
  const lock = await getDowngradeLockInfo(supabase, orgId);
  if (lock.locked && !lock.memberIds.includes(memberId)) throw new Error(LOCK_MESSAGE);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function assertMemberUnlockedByUserId(supabase: any, orgId: string, userId: string): Promise<void> {
  const lock = await getDowngradeLockInfo(supabase, orgId);
  if (!lock.locked) return;
  const { data: member } = await supabase.from('organization_members')
    .select('id').eq('org_id', orgId).eq('user_id', userId).single();
  if (!member || !lock.memberIds.includes(member.id)) throw new Error(LOCK_MESSAGE);
}

/** Resolve o org_id de um evento — várias actions de escala só têm o eventId. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getEventOrgId(supabase: any, eventId: string): Promise<string> {
  const { data } = await supabase.from('events').select('org_id').eq('id', eventId).single();
  if (!data) throw new Error('Evento não encontrado');
  return data.org_id;
}

/** Resolve o org_id a partir de um event_ministries.id. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getEventMinistryOrgId(supabase: any, eventMinistryId: string): Promise<{ orgId: string; ministryId: string }> {
  const { data } = await supabase.from('event_ministries')
    .select('ministry_id, event:events(org_id)').eq('id', eventMinistryId).single();
  if (!data) throw new Error('Ministério do evento não encontrado');
  const row = data as unknown as { ministry_id: string; event: { org_id: string } | null };
  if (!row.event) throw new Error('Evento não encontrado');
  return { orgId: row.event.org_id, ministryId: row.ministry_id };
}
