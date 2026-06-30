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

export async function createOrganization(name: string): Promise<{ error?: string }> {
  // Verify the user via their session (anon client with cookies)
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { error: 'Utilizador não autenticado' };

  // Use admin client to bypass RLS for the insert
  const admin = getAdminClient();
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

  const { data: newOrg, error: orgError } = await admin
    .from('organizations')
    .insert({ name, invite_code: inviteCode })
    .select()
    .single();

  if (orgError || !newOrg) return { error: orgError?.message ?? 'Erro ao criar organização' };

  const { error: memberError } = await admin
    .from('organization_members')
    .insert({ org_id: newOrg.id, user_id: user.id, role: 'admin' });

  if (memberError) return { error: memberError.message };

  redirect(`/${newOrg.id}/dashboard`);
}
