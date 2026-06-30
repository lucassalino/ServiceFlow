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
