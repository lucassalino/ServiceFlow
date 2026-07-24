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
 * `functions` são as funções globais do utilizador (guardadas em
 * default_functions para pré-preencher noutras orgs). Para cada ministério
 * selecionado, atribui a interseção das funções globais com as funções desse
 * ministério (ou todas, se o ministério não tiver catálogo de funções).
 */
export async function saveMyParticipationAction(
  orgId: string,
  input: {
    phone: string | null;
    birthday: string | null;
    functions: string[];
    ministryIds: string[];
  },
): Promise<void> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');

  const profileUpdate = {
    phone: input.phone,
    birthday: input.birthday,
    default_functions: input.functions,
    updated_at: new Date().toISOString(),
  } as never;
  const { error: profErr } = await supabase.from('profiles').update(profileUpdate).eq('id', user.id);
  if (profErr) throw new Error(profErr.message);

  // Ministérios da org (com as suas funções) para calcular interseção.
  const { data: orgMinistries } = await supabase.from('ministries').select('id, functions').eq('org_id', orgId);
  const list = (orgMinistries ?? []) as { id: string; functions: string[] | null }[];
  const orgMinistryIds = list.map((m) => m.id);

  if (orgMinistryIds.length > 0) {
    await supabase.from('ministry_members').delete().eq('user_id', user.id).in('ministry_id', orgMinistryIds);
  }

  const selected = list.filter((m) => input.ministryIds.includes(m.id));
  if (selected.length > 0) {
    const rows = selected.map((m) => {
      const catalog = m.functions ?? [];
      const fns = catalog.length > 0 ? input.functions.filter((f) => catalog.includes(f)) : input.functions;
      return { ministry_id: m.id, user_id: user.id, functions: fns, is_active: true };
    });
    const { error } = await supabase.from('ministry_members').insert(rows);
    if (error) throw new Error(error.message);
  }
}

/** Guarda apenas as funções globais do utilizador (Definições → As minhas funções). */
export async function saveMyDefaultFunctionsAction(functions: string[]): Promise<void> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  const update = { default_functions: functions, updated_at: new Date().toISOString() } as never;
  const { error } = await supabase.from('profiles').update(update).eq('id', user.id);
  if (error) throw new Error(error.message);
}
