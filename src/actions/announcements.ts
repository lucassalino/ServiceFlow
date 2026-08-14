'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import type { Announcement } from '@/types/models';
import type { Database } from '@/types/database';

function getAdmin() {
  return createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

async function requireAdminOrLeader(orgId: string, userId: string) {
  const admin = getAdmin();
  const { data: membership } = await admin
    .from('organization_members').select('role')
    .eq('org_id', orgId).eq('user_id', userId).maybeSingle();
  const role = (membership as { role?: string } | null)?.role;
  if (role !== 'admin' && role !== 'leader') {
    throw new Error('Só admins e líderes podem gerir o mural de recados');
  }
}

export async function fetchAnnouncementsAction(orgId: string): Promise<Announcement[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('announcements')
    .select('*, profile:profiles!announcements_created_by_fkey(*)')
    .eq('org_id', orgId)
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data as unknown as Announcement[];
}

export interface AnnouncementPayload { title: string; body: string; pinned?: boolean }

export async function createAnnouncementAction(orgId: string, payload: AnnouncementPayload): Promise<Announcement> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  await requireAdminOrLeader(orgId, user.id);
  const admin = getAdmin();
  const { data, error } = await admin.from('announcements')
    .insert({ org_id: orgId, title: payload.title, body: payload.body, pinned: payload.pinned ?? false, created_by: user.id })
    .select().single();
  if (error) throw new Error(error.message);
  return data as Announcement;
}

export async function updateAnnouncementAction(id: string, payload: AnnouncementPayload): Promise<void> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  const admin = getAdmin();
  const { data: existing } = await admin.from('announcements').select('org_id').eq('id', id).single();
  if (!existing) throw new Error('Recado não encontrado');
  await requireAdminOrLeader(existing.org_id, user.id);
  const { error } = await admin.from('announcements')
    .update({ title: payload.title, body: payload.body, pinned: payload.pinned ?? false, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteAnnouncementAction(id: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  const admin = getAdmin();
  const { data: existing } = await admin.from('announcements').select('org_id').eq('id', id).single();
  if (!existing) throw new Error('Recado não encontrado');
  await requireAdminOrLeader(existing.org_id, user.id);
  const { error } = await admin.from('announcements').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
