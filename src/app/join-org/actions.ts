'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import type { Database } from '@/types/database';

function getAdminClient() {
  return createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function joinOrganization(inviteCode: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { error: 'Utilizador não autenticado' };

  const admin = getAdminClient();

  const { data: org, error: orgError } = await admin
    .from('organizations')
    .select('id')
    .eq('invite_code', inviteCode.toUpperCase())
    .single();

  if (orgError || !org) return { error: 'Código de convite inválido' };

  const { data: existing } = await admin
    .from('organization_members')
    .select('id')
    .eq('org_id', org.id)
    .eq('user_id', user.id)
    .single();

  if (existing) redirect(`/${org.id}/dashboard`);

  const { error: memberError } = await admin
    .from('organization_members')
    .insert({ org_id: org.id, user_id: user.id, role: 'member' });

  if (memberError) return { error: memberError.message };

  redirect(`/${org.id}/dashboard`);
}
