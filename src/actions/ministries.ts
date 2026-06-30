'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { PRESET_MINISTRIES } from '@/lib/constants';
import type { Ministry } from '@/types/models';
import type { Database } from '@/types/database';

function getAdmin() {
  return createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

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
): Promise<Ministry> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  const admin = getAdmin();
  const { data, error } = await admin.from('ministries')
    .insert({ ...payload, functions: payload.functions ?? [], org_id: orgId }).select().single();
  if (error) throw new Error(error.message);
  return data as Ministry;
}

export async function updateMinistryAction(
  id: string,
  payload: { name: string; icon: string; color: string; functions?: string[] },
): Promise<void> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  const admin = getAdmin();
  const { error } = await admin.from('ministries')
    .update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function toggleMinistryActiveAction(id: string, isActive: boolean): Promise<void> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  const admin = getAdmin();
  const { error } = await admin.from('ministries')
    .update({ is_active: isActive, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function importPresetMinistriesAction(orgId: string): Promise<number> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  const admin = getAdmin();

  const { data: existing } = await admin.from('ministries').select('name').eq('org_id', orgId);
  const existingNames = new Set((existing ?? []).map((m) => m.name.toLowerCase()));

  const toCreate = (PRESET_MINISTRIES as unknown as { name: string; icon: string; color: string; functions: string[] }[])
    .filter((p) => !existingNames.has(p.name.toLowerCase()));
  if (toCreate.length === 0) return 0;

  const rows = toCreate.map((p) => ({
    org_id: orgId, name: p.name, icon: p.icon, color: p.color,
    functions: p.functions, is_active: true,
  }));
  const { error } = await admin.from('ministries').insert(rows);
  if (error) throw new Error(error.message);
  return toCreate.length;
}

export async function deleteMinistryAction(id: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  const admin = getAdmin();
  const { error } = await admin.from('ministries').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
