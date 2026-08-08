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
 *
 * IMPORTANTE — porque não lançamos erros aqui: o Next.js apaga as mensagens
 * de `Error` lançadas em server actions nos builds de produção (ver
 * `lib/plan-limits.ts`). As actions que usam este guard DEVOLVEM
 * `LockGuarded<T>` em vez de lançar, e o `DowngradeLockError` só é
 * construído no cliente (dentro do hook), via `unwrapLockGuarded`.
 */

export const DOWNGRADE_LOCK_CODE = 'DOWNGRADE_LOCKED' as const;

export const DOWNGRADE_LOCK_MESSAGE =
  'A tua organização está com o plano despromovido e este recurso não está entre os escolhidos para continuar ativo. ' +
  'Escolhe outro em Definições ou faz upgrade do plano para voltar a editar tudo.';

/** Resultado de uma ação que pode ser bloqueada pelo "só leitura" de downgrade. */
export type LockGuarded<T> =
  | { ok: true; data: T }
  | { ok: false; code: typeof DOWNGRADE_LOCK_CODE; message: string };

export class DowngradeLockError extends Error {
  readonly code = DOWNGRADE_LOCK_CODE;
  constructor(message: string = DOWNGRADE_LOCK_MESSAGE) {
    super(message);
    this.name = 'DowngradeLockError';
  }
}

export function isDowngradeLockError(e: unknown): e is DowngradeLockError {
  return e instanceof DowngradeLockError;
}

/** Converte o resultado de uma action em dados, ou lança DowngradeLockError. */
export function unwrapLockGuarded<T>(result: LockGuarded<T>): T {
  if (result.ok) return result.data;
  throw new DowngradeLockError(result.message);
}

const BLOCKED: { ok: false; code: typeof DOWNGRADE_LOCK_CODE; message: string } =
  { ok: false, code: DOWNGRADE_LOCK_CODE, message: DOWNGRADE_LOCK_MESSAGE };

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

/** `null` se o ministério pode ser editado; caso contrário, o resultado bloqueado a devolver. */
export async function checkMinistryUnlocked(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any, orgId: string, ministryId: string,
): Promise<typeof BLOCKED | null> {
  const lock = await getDowngradeLockInfo(supabase, orgId);
  if (lock.locked && !lock.ministryIds.includes(ministryId)) return BLOCKED;
  return null;
}

export async function checkMemberUnlockedById(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any, orgId: string, memberId: string,
): Promise<typeof BLOCKED | null> {
  const lock = await getDowngradeLockInfo(supabase, orgId);
  if (lock.locked && !lock.memberIds.includes(memberId)) return BLOCKED;
  return null;
}

export async function checkMemberUnlockedByUserId(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any, orgId: string, userId: string,
): Promise<typeof BLOCKED | null> {
  const lock = await getDowngradeLockInfo(supabase, orgId);
  if (!lock.locked) return null;
  const { data: member } = await supabase.from('organization_members')
    .select('id').eq('org_id', orgId).eq('user_id', userId).single();
  if (!member || !lock.memberIds.includes(member.id)) return BLOCKED;
  return null;
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
