'use server';

import { createClient } from '@/lib/supabase/server';
import { PRESET_MINISTRIES } from '@/lib/constants';
import type { Ministry } from '@/types/models';
import { canAddResource } from '@/actions/subscriptions';
import { PLAN_LIMIT_CODE, type PlanGuarded } from '@/lib/plan-limits';
import { checkMinistryUnlocked, type LockGuarded } from '@/lib/downgrade-lock';

export async function fetchMinistriesAction(orgId: string): Promise<Ministry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('ministries')
    .select('*').eq('org_id', orgId).order('is_active', { ascending: false }).order('name');
  if (error) throw new Error(error.message);
  return data as Ministry[];
}

export async function createMinistryAction(
  orgId: string,
  payload: { name: string; icon: string; color: string; functions?: string[] },
): Promise<PlanGuarded<Ministry>> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');

  // Limite de ministérios do plano. Devolvemos (não lançamos) para o payload
  // sobreviver até ao cliente e abrir o modal certo.
  const limit = await canAddResource(orgId, 'ministry');
  if (!limit.allowed) {
    return {
      ok: false, code: PLAN_LIMIT_CODE, resource: 'ministry',
      used: limit.used, limit: limit.limit, planName: limit.planName,
    };
  }

  const { data, error } = await supabase.from('ministries')
    .insert({ ...payload, functions: payload.functions ?? [], org_id: orgId }).select().single();
  if (error) throw new Error(error.message);
  return { ok: true, data: data as Ministry };
}

export async function updateMinistryAction(
  id: string,
  payload: { name: string; icon: string; color: string; functions?: string[] },
): Promise<LockGuarded<void>> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');

  const { data: ministry } = await supabase.from('ministries').select('org_id').eq('id', id).single();
  if (!ministry) throw new Error('Ministério não encontrado');
  const blocked = await checkMinistryUnlocked(supabase, ministry.org_id, id);
  if (blocked) return blocked;

  const { error } = await supabase.from('ministries')
    .update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw new Error(error.message);
  return { ok: true, data: undefined };
}

export async function toggleMinistryActiveAction(id: string, isActive: boolean): Promise<void> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  const { error } = await supabase.from('ministries')
    .update({ is_active: isActive, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function importPresetMinistriesAction(orgId: string): Promise<number> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');

  const { data: existing } = await supabase.from('ministries').select('name').eq('org_id', orgId);
  const existingNames = new Set((existing ?? []).map((m) => m.name.toLowerCase()));

  const toCreate = (PRESET_MINISTRIES as unknown as { name: string; icon: string; color: string; functions: string[] }[])
    .filter((p) => !existingNames.has(p.name.toLowerCase()));
  if (toCreate.length === 0) return 0;

  const rows = toCreate.map((p) => ({
    org_id: orgId, name: p.name, icon: p.icon, color: p.color,
    functions: p.functions, is_active: true,
  }));
  const { error } = await supabase.from('ministries').insert(rows);
  if (error) throw new Error(error.message);
  return toCreate.length;
}

export async function deleteMinistryAction(id: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  const { error } = await supabase.from('ministries').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
