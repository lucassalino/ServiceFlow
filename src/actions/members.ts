'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import type { OrganizationMember, MinistryMember, OrgRole } from '@/types/models';
import type { Database } from '@/types/database';

function getAdmin() {
  return createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

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
  const admin = getAdmin();
  const { error } = await admin.from('organization_members').update({ role }).eq('id', memberId);
  if (error) throw new Error(error.message);
}

export async function toggleMemberActiveAction(memberId: string, isActive: boolean): Promise<void> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  const admin = getAdmin();
  const { error } = await admin.from('organization_members')
    .update({ is_active: isActive }).eq('id', memberId);
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
  const admin = getAdmin();
  const { data: orgMinistries } = await admin
    .from('ministries').select('id').eq('org_id', orgId);
  const orgMinistryIds = (orgMinistries ?? []).map((m: { id: string }) => m.id);
  if (orgMinistryIds.length > 0) {
    await admin.from('ministry_members')
      .delete().eq('user_id', userId).in('ministry_id', orgMinistryIds);
  }
  if (assignments.length === 0) return;
  const rows = assignments.map(({ ministryId, functions }) => ({
    ministry_id: ministryId, user_id: userId, functions, is_active: true,
  }));
  const { error } = await admin.from('ministry_members').insert(rows);
  if (error) throw new Error(error.message);
}

export async function upsertMinistryMembersAction(
  ministryId: string,
  members: { userId: string; functions: string[] }[],
): Promise<void> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  const admin = getAdmin();
  await admin.from('ministry_members').delete().eq('ministry_id', ministryId);
  if (members.length === 0) return;
  const rows = members.map(({ userId, functions }) => ({
    ministry_id: ministryId,
    user_id: userId,
    functions,
    is_active: true,
  }));
  const { error } = await admin.from('ministry_members').insert(rows);
  if (error) throw new Error(error.message);
}
