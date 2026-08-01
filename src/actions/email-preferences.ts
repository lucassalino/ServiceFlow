'use server';

import { createClient } from '@/lib/supabase/server';

/** Preferência de emails de notificação do próprio utilizador. */
export async function fetchEmailOptOutAction(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');

  const { data } = await supabase
    .from('profiles').select('email_opt_out').eq('id', user.id).single();
  return !!(data as { email_opt_out?: boolean } | null)?.email_opt_out;
}

/** Liga/desliga os emails de notificação. Não afeta emails de conta. */
export async function setEmailOptOutAction(optOut: boolean): Promise<void> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');

  const { error } = await supabase
    .from('profiles')
    .update({ email_opt_out: optOut, updated_at: new Date().toISOString() } as never)
    .eq('id', user.id);
  if (error) throw new Error(error.message);
}
