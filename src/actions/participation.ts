'use server';

import { createClient } from '@/lib/supabase/server';

export interface MyParticipationData {
  profile: { full_name: string; phone: string | null; birthday: string | null; default_functions: string[] };
  ministries: { id: string; name: string; icon: string; color: string; functions: string[] }[];
  mine: { ministry_id: string; functions: string[] }[];
}

/** Carrega tudo para o painel "As minhas participações" numa org. */
export async function fetchMyParticipationAction(orgId: string): Promise<MyParticipationData> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');

  const { data: profile } = await supabase
    .from('profiles').select('full_name, phone, birthday, default_functions').eq('id', user.id).single();

  const { data: ministries } = await supabase
    .from('ministries').select('id, name, icon, color, functions')
    .eq('org_id', orgId).eq('is_active', true).order('name');

  const orgMinistryIds = (ministries ?? []).map((m: { id: string }) => m.id);
  let mine: { ministry_id: string; functions: string[] }[] = [];
  if (orgMinistryIds.length > 0) {
    const { data } = await supabase
      .from('ministry_members').select('ministry_id, functions')
      .eq('user_id', user.id).eq('is_active', true).in('ministry_id', orgMinistryIds);
    mine = (data ?? []) as { ministry_id: string; functions: string[] }[];
  }

  const p = profile as { full_name: string; phone: string | null; birthday: string | null; default_functions: string[] | null } | null;
  return {
    profile: {
      full_name: p?.full_name ?? '',
      phone: p?.phone ?? null,
      birthday: p?.birthday ?? null,
      default_functions: p?.default_functions ?? [],
    },
    ministries: (ministries ?? []) as MyParticipationData['ministries'],
    mine,
  };
}

/**
 * Grava as participações do próprio utilizador nesta org + dados de perfil.
 * Guarda também as funções escolhidas como "default_functions" (globais) para
 * pré-preencher quando entrar noutra organização.
 */
export async function saveMyParticipationAction(
  orgId: string,
  input: {
    phone: string | null;
    birthday: string | null;
    entries: { ministryId: string; functions: string[] }[];
  },
): Promise<void> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');

  // União de todas as funções escolhidas → guardar como preferências globais.
  const chosenFns = Array.from(new Set(input.entries.flatMap((e) => e.functions)));

  const profileUpdate = {
    phone: input.phone,
    birthday: input.birthday,
    default_functions: chosenFns,
    updated_at: new Date().toISOString(),
  } as never;
  const { error: profErr } = await supabase.from('profiles').update(profileUpdate).eq('id', user.id);
  if (profErr) throw new Error(profErr.message);

  // Reset das minhas participações nesta org e re-inserção das selecionadas.
  const { data: orgMinistries } = await supabase.from('ministries').select('id').eq('org_id', orgId);
  const orgMinistryIds = (orgMinistries ?? []).map((m: { id: string }) => m.id);
  if (orgMinistryIds.length > 0) {
    await supabase.from('ministry_members').delete().eq('user_id', user.id).in('ministry_id', orgMinistryIds);
  }
  const valid = input.entries.filter((e) => orgMinistryIds.includes(e.ministryId));
  if (valid.length > 0) {
    const rows = valid.map((e) => ({ ministry_id: e.ministryId, user_id: user.id, functions: e.functions, is_active: true }));
    const { error } = await supabase.from('ministry_members').insert(rows);
    if (error) throw new Error(error.message);
  }
}
