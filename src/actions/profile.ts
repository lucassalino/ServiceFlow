'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import type { UserProfile } from '@/types/models';
import type { Database } from '@/types/database';

function getAdmin() {
  return createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function fetchProfileAction(): Promise<UserProfile> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  const { data, error } = await supabase.from('profiles')
    .select('*').eq('id', user.id).single();
  if (error) throw new Error(error.message);
  return data as UserProfile;
}

export async function updateProfileAction(
  payload: { full_name: string; phone: string | null; avatar_url: string | null },
): Promise<UserProfile> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  const admin = getAdmin();
  const { data, error } = await admin.from('profiles')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', user.id).select().single();
  if (error) throw new Error(error.message);
  return data as UserProfile;
}

export async function deleteOwnAccountAction(): Promise<void> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  const { error } = await supabase.rpc('delete_own_account');
  if (error) throw new Error(error.message);
}
