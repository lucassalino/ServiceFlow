'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { getDowngradeLockInfo } from '@/lib/downgrade-lock';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getAdmin(): any {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

async function requireOrgAdmin(orgId: string) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Sessão expirada');

  const admin = getAdmin();
  const { data } = await admin.from('organization_members')
    .select('role').eq('org_id', orgId).eq('user_id', user.id).eq('is_active', true).single();
  if (!data || data.role !== 'admin') {
    throw new Error('Só um administrador da organização pode fazer isto.');
  }
  return admin;
}

/**
 * Estado do bloqueio, para qualquer membro (não só o admin) — usado pelo
 * cliente para desativar a entrada em recursos não escolhidos antes de sequer
 * tentar guardar (a action em si já bloqueia, isto é só para a UX).
 */
export async function fetchDowngradeLockInfoAction(orgId: string): Promise<{
  locked: boolean; ministryIds: string[]; memberIds: string[];
}> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Sessão expirada');

  return getDowngradeLockInfo(supabase, orgId);
}

export interface DowngradeLockState {
  locked: boolean;
  /** Só definido quando `locked` — recursos disponíveis para escolher. */
  ministries?: { id: string; name: string }[];
  members?: { id: string; name: string }[];
  selectedMinistryId?: string | null;
  selectedMemberIds?: string[];
}

/**
 * Estado do bloqueio de downgrade de uma organização. Quando `locked`, o
 * admin precisa de escolher até 1 ministério + 10 pessoas para manterem-se
 * operacionais — o resto fica só de leitura (nada é apagado).
 */
export async function fetchDowngradeLockStateAction(orgId: string): Promise<DowngradeLockState> {
  const admin = await requireOrgAdmin(orgId);

  const { data: sub } = await admin.from('org_subscriptions').select('status').eq('org_id', orgId).single();
  if (sub?.status !== 'downgraded_locked') return { locked: false };

  const [{ data: org }, { data: ministries }, { data: members }] = await Promise.all([
    admin.from('organizations').select('active_ministry_ids, active_member_ids').eq('id', orgId).single(),
    admin.from('ministries').select('id, name').eq('org_id', orgId).order('name'),
    admin.from('organization_members').select('id, profile:profiles(full_name)').eq('org_id', orgId).eq('is_active', true),
  ]);

  return {
    locked: true,
    ministries: (ministries ?? []).map((m: { id: string; name: string }) => ({ id: m.id, name: m.name })),
    members: (members ?? []).map((m: { id: string; profile: { full_name: string } | null }) => ({
      id: m.id, name: m.profile?.full_name ?? 'Sem nome',
    })),
    selectedMinistryId: org?.active_ministry_ids?.[0] ?? null,
    selectedMemberIds: org?.active_member_ids ?? [],
  };
}

/**
 * Regista quais o ministério (no máximo 1) e as pessoas (no máximo 10) que
 * ficam operacionais enquanto a org estiver despromovida. Não desbloqueia a
 * org — só define o subconjunto que fica ativo dentro do Semente.
 */
export async function chooseDowngradeSurvivorsAction(
  orgId: string, ministryId: string | null, memberIds: string[],
): Promise<void> {
  const admin = await requireOrgAdmin(orgId);

  const { data: sub } = await admin.from('org_subscriptions').select('status').eq('org_id', orgId).single();
  if (sub?.status !== 'downgraded_locked') {
    throw new Error('Esta organização não está despromovida — não há nada para escolher.');
  }
  if (memberIds.length > 10) {
    throw new Error('Só podes escolher até 10 pessoas.');
  }

  const { error } = await admin.from('organizations').update({
    active_ministry_ids: ministryId ? [ministryId] : [],
    active_member_ids: memberIds,
    updated_at: new Date().toISOString(),
  }).eq('id', orgId);
  if (error) throw new Error(error.message);
}
