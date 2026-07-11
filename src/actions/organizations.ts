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

export async function leaveOrganizationAction(orgId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');

  const admin = getAdmin();

  const { data: admins, error: adminsError } = await admin
    .from('organization_members')
    .select('id, user_id')
    .eq('org_id', orgId).eq('role', 'admin').eq('is_active', true);
  if (adminsError) throw new Error(adminsError.message);

  const isOnlyAdmin = (admins ?? []).length === 1 && admins![0].user_id === user.id;
  if (isOnlyAdmin) {
    throw new Error(
      'Não podes saír: és o único administrador desta organização. Atribui outro admin primeiro.',
    );
  }

  const { error } = await admin.from('organization_members')
    .delete().eq('org_id', orgId).eq('user_id', user.id);
  if (error) throw new Error(error.message);
}
