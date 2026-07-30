'use server';

import { createClient } from '@/lib/supabase/server';
import type { OrganizationMember, MinistryMember, OrgRole } from '@/types/models';

export async function fetchOrgMembersAction(orgId: string): Promise<OrganizationMember[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('organization_members')
    .select('*, profile:profiles(*)').eq('org_id', orgId).order('joined_at');
  if (error) throw new Error(error.message);
  return data as OrganizationMember[];
}

export async function fetchMinistryMembersAction(ministryId: string): Promise<MinistryMember[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('ministry_members')
    .select('*, profile:profiles(*)').eq('ministry_id', ministryId).eq('is_active', true);
  if (error) throw new Error(error.message);
  return data as MinistryMember[];
}

// Returns each ministry's own function catalog — used to filter the function picker in the event wizard.
export async function fetchMinistriesFunctionsAction(
  ministryIds: string[],
): Promise<Record<string, string[]>> {
  if (ministryIds.length === 0) return {};
  const supabase = await createClient();
  const { data } = await supabase
    .from('ministries')
    .select('id, functions')
    .in('id', ministryIds);
  const result: Record<string, string[]> = {};
  for (const row of (data ?? []) as { id: string; functions: string[] }[]) {
    result[row.id] = row.functions ?? [];
  }
  return result;
}

export async function updateMemberRoleAction(memberId: string, role: OrgRole): Promise<void> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  const { error } = await supabase.from('organization_members').update({ role }).eq('id', memberId);
  if (error) throw new Error(error.message);
}

export async function toggleMemberActiveAction(memberId: string, isActive: boolean): Promise<void> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  const { error } = await supabase.from('organization_members')
    .update({ is_active: isActive }).eq('id', memberId);
  if (error) throw new Error(error.message);
}

/**
 * Remove definitivamente uma pessoa da organização.
 * Limpa também as atribuições da pessoa (ministérios e escalas) desta org.
 * Não apaga a conta/perfil global — a pessoa pode pertencer a outras organizações.
 */
export async function deleteMemberAction(memberId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');

  // Buscar o membro a remover
  const { data: member, error: memberErr } = await supabase
    .from('organization_members').select('id, org_id, user_id').eq('id', memberId).single();
  if (memberErr || !member) throw new Error('Membro não encontrado');

  // Só um admin da MESMA organização pode remover, e não a si próprio
  const { data: caller } = await supabase
    .from('organization_members').select('role')
    .eq('org_id', member.org_id).eq('user_id', user.id).single();
  if (!caller || caller.role !== 'admin') {
    throw new Error('Apenas administradores podem remover membros');
  }
  if (member.user_id === user.id) {
    throw new Error('Não podes remover-te a ti próprio');
  }

  // Limpar participação em ministérios desta org
  const { data: orgMinistries } = await supabase
    .from('ministries').select('id').eq('org_id', member.org_id);
  const ministryIds = (orgMinistries ?? []).map((m: { id: string }) => m.id);
  if (ministryIds.length > 0) {
    await supabase.from('ministry_members')
      .delete().eq('user_id', member.user_id).in('ministry_id', ministryIds);
  }

  // Limpar escalas em eventos desta org
  const { data: orgEvents } = await supabase
    .from('events').select('id').eq('org_id', member.org_id);
  const eventIds = (orgEvents ?? []).map((e: { id: string }) => e.id);
  if (eventIds.length > 0) {
    const { data: eventMins } = await supabase
      .from('event_ministries').select('id').in('event_id', eventIds);
    const emIds = (eventMins ?? []).map((em: { id: string }) => em.id);
    if (emIds.length > 0) {
      await supabase.from('event_schedules')
        .delete().eq('user_id', member.user_id).in('event_ministry_id', emIds);
    }
  }

  // Remover o membro da organização
  const { error } = await supabase.from('organization_members').delete().eq('id', memberId);
  if (error) throw new Error(error.message);
}

export async function fetchMemberMinistriesAction(
  userId: string,
): Promise<{ ministry_id: string; functions: string[] }[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('ministry_members')
    .select('ministry_id, functions')
    .eq('user_id', userId)
    .eq('is_active', true);
  if (error) throw new Error(error.message);
  return (data ?? []) as { ministry_id: string; functions: string[] }[];
}

export async function upsertMemberMinistriesAction(
  userId: string,
  orgId: string,
  assignments: { ministryId: string; functions: string[] }[],
): Promise<void> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  const { data: orgMinistries } = await supabase
    .from('ministries').select('id').eq('org_id', orgId);
  const orgMinistryIds = (orgMinistries ?? []).map((m: { id: string }) => m.id);
  if (orgMinistryIds.length > 0) {
    await supabase.from('ministry_members')
      .delete().eq('user_id', userId).in('ministry_id', orgMinistryIds);
  }
  if (assignments.length === 0) return;
  // Dedup por ministério (une as funções) para nunca gerar (ministry_id,user_id)
  // repetido, e upsert para ser idempotente mesmo se o delete não limpar tudo.
  const byMinistry = new Map<string, Set<string>>();
  for (const { ministryId, functions } of assignments) {
    const set = byMinistry.get(ministryId) ?? new Set<string>();
    for (const f of functions) set.add(f);
    byMinistry.set(ministryId, set);
  }
  const rows = [...byMinistry.entries()].map(([ministry_id, fns]) => ({
    ministry_id, user_id: userId, functions: [...fns], is_active: true,
  }));
  const { error } = await supabase.from('ministry_members')
    .upsert(rows, { onConflict: 'ministry_id,user_id' });
  if (error) throw new Error(error.message);
}

export async function upsertMinistryMembersAction(
  ministryId: string,
  members: { userId: string; functions: string[] }[],
): Promise<void> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  await supabase.from('ministry_members').delete().eq('ministry_id', ministryId);
  if (members.length === 0) return;
  // Dedup por utilizador (une funções) para evitar (ministry_id,user_id) repetido.
  const byUser = new Map<string, Set<string>>();
  for (const { userId, functions } of members) {
    const set = byUser.get(userId) ?? new Set<string>();
    for (const f of functions) set.add(f);
    byUser.set(userId, set);
  }
  const rows = [...byUser.entries()].map(([user_id, fns]) => ({
    ministry_id: ministryId, user_id, functions: [...fns], is_active: true,
  }));
  const { error } = await supabase.from('ministry_members')
    .upsert(rows, { onConflict: 'ministry_id,user_id' });
  if (error) throw new Error(error.message);
}
