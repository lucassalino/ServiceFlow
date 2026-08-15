'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import type { Organization, OrganizationMember } from '@/types/models';
import type { Database } from '@/types/database';

function getAdmin() {
  return createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function fetchOrgMembershipsAction(): Promise<(OrganizationMember & { organization: Organization })[]> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  const { data, error } = await supabase.from('organization_members')
    .select('*, organization:organizations(*)')
    .eq('user_id', user.id).eq('is_active', true);
  if (error) throw new Error(error.message);
  return data as (OrganizationMember & { organization: Organization })[];
}

/** Faz upload do logótipo da organização e grava o URL. Só admins. */
export async function uploadOrgLogoAction(formData: FormData): Promise<string> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');

  const file = formData.get('file') as File | null;
  const orgId = formData.get('orgId') as string | null;
  if (!file || !orgId) throw new Error('Ficheiro em falta');

  const admin = getAdmin();

  // Só um admin da organização pode alterar o logótipo.
  const { data: membership } = await admin
    .from('organization_members').select('role')
    .eq('org_id', orgId).eq('user_id', user.id).single();
  if ((membership as { role?: string } | null)?.role !== 'admin') {
    throw new Error('Apenas administradores podem alterar o logótipo');
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const path = `org-logos/${orgId}-${crypto.randomUUID()}.${ext}`;
  const buffer = new Uint8Array(await file.arrayBuffer());
  const { error: uploadError } = await admin.storage
    .from('avatars')
    .upload(path, buffer, { contentType: file.type, upsert: true });
  if (uploadError) throw new Error(uploadError.message);

  const { data } = admin.storage.from('avatars').getPublicUrl(path);
  const logoUrl = `${data.publicUrl}?t=${Date.now()}`;

  const { error: updErr } = await admin
    .from('organizations')
    .update({ logo_url: logoUrl, updated_at: new Date().toISOString() })
    .eq('id', orgId);
  if (updErr) throw new Error(updErr.message);

  return logoUrl;
}

export async function leaveOrganizationAction(orgId: string): Promise<{ error?: string; needsDelete?: boolean }> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: 'Sessão expirada' };

  const admin = getAdmin();

  const { data: members, error: membersError } = await admin
    .from('organization_members')
    .select('user_id, role')
    .eq('org_id', orgId).eq('is_active', true);
  if (membersError) return { error: membersError.message };

  const list = (members ?? []) as { user_id: string; role: string }[];

  // Última pessoa da organização → saír significa eliminar a organização.
  const isLastPerson = list.length <= 1 && list.every((m) => m.user_id === user.id);
  if (isLastPerson) {
    return { needsDelete: true };
  }

  // Único admin (mas há mais pessoas) → tem de passar o cargo a outra pessoa primeiro.
  const admins = list.filter((m) => m.role === 'admin');
  const isOnlyAdmin = admins.length === 1 && admins[0].user_id === user.id;
  if (isOnlyAdmin) {
    return {
      error: 'Não podes saír: és o único administrador desta organização. Atribui outro admin ou elimina a organização.',
    };
  }

  const { error } = await admin.from('organization_members')
    .delete().eq('org_id', orgId).eq('user_id', user.id);
  if (error) return { error: error.message };
  return {};
}

/**
 * Elimina permanentemente a organização e todos os dados associados
 * (eventos, escalas, ministérios, músicas, convites, membros). Só admin.
 */
export async function deleteOrganizationAction(orgId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: 'Sessão expirada' };

  const admin = getAdmin();

  const { data: myMembership } = await admin
    .from('organization_members').select('role')
    .eq('org_id', orgId).eq('user_id', user.id).maybeSingle();
  if ((myMembership as { role?: string } | null)?.role !== 'admin') {
    return { error: 'Apenas administradores podem eliminar a organização.' };
  }

  // Apaga os dados dependentes por ordem (filhos primeiro).
  const { data: events } = await admin.from('events').select('id').eq('org_id', orgId);
  const eventIds = (events ?? []).map((e) => (e as { id: string }).id);
  const { data: ministries } = await admin.from('ministries').select('id').eq('org_id', orgId);
  const ministryIds = (ministries ?? []).map((m) => (m as { id: string }).id);

  if (eventIds.length > 0) {
    const { data: ems } = await admin.from('event_ministries').select('id').in('event_id', eventIds);
    const emIds = (ems ?? []).map((e) => (e as { id: string }).id);
    if (emIds.length > 0) await admin.from('event_schedules').delete().in('event_ministry_id', emIds);
    await admin.from('event_setlists').delete().in('event_id', eventIds);
    await admin.from('event_ministries').delete().in('event_id', eventIds);
    await admin.from('notifications').delete().in('event_id', eventIds);
  }
  await admin.from('events').delete().eq('org_id', orgId);
  await admin.from('songs').delete().eq('org_id', orgId);
  if (ministryIds.length > 0) await admin.from('ministry_members').delete().in('ministry_id', ministryIds);
  await admin.from('ministries').delete().eq('org_id', orgId);
  await admin.from('organization_invites').delete().eq('org_id', orgId);
  await admin.from('subscriptions').delete().eq('org_id', orgId);
  await admin.from('organization_members').delete().eq('org_id', orgId);

  const { error } = await admin.from('organizations').delete().eq('id', orgId);
  if (error) return { error: error.message };
  return {};
}
