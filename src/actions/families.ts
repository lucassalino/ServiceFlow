'use server';

import { createClient } from '@/lib/supabase/server';

export type FamilyPreference = 'junto' | 'separado' | 'indiferente';

export interface FamilyRelationship {
  rowId: string;
  otherUserId: string;
  otherName: string;
  otherAvatarUrl: string | null;
  preference: FamilyPreference;
  status: 'pending' | 'accepted';
  /** true se fui eu que propus esta preferência (por isso estou à espera da outra pessoa). */
  isRequester: boolean;
}

export interface OrgFamilyLink {
  userId: string;
  otherUserId: string;
  otherName: string;
  preference: FamilyPreference;
}

// `family_relationships` é uma tabela nova, ainda sem tipos gerados (ver
// migração 048) — daí o `as any` no cliente devolvido aqui.
async function requireUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Sessão expirada');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { supabase: supabase as any, userId: user.id };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function profilesByIds(supabase: any, userIds: string[]): Promise<Map<string, { full_name: string; avatar_url: string | null }>> {
  if (userIds.length === 0) return new Map();
  const { data } = await supabase.from('profiles').select('id, full_name, avatar_url').in('id', userIds);
  const map = new Map<string, { full_name: string; avatar_url: string | null }>();
  for (const p of (data ?? []) as { id: string; full_name: string; avatar_url: string | null }[]) {
    map.set(p.id, { full_name: p.full_name, avatar_url: p.avatar_url });
  }
  return map;
}

function normalizePair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

/** Todas as minhas relações de família nesta organização (pendentes e aceites, dos dois lados). */
export async function fetchMyFamilyRelationshipsAction(orgId: string): Promise<FamilyRelationship[]> {
  const { supabase, userId } = await requireUser();

  const { data: rows } = await supabase.from('family_relationships')
    .select('id, user_id_1, user_id_2, preference, requested_by, status')
    .eq('org_id', orgId)
    .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`)
    .order('created_at');
  const relationships = (rows ?? []) as {
    id: string; user_id_1: string; user_id_2: string;
    preference: FamilyPreference; requested_by: string; status: 'pending' | 'accepted';
  }[];
  if (relationships.length === 0) return [];

  const otherIds = relationships.map((r) => (r.user_id_1 === userId ? r.user_id_2 : r.user_id_1));
  const profiles = await profilesByIds(supabase, otherIds);

  return relationships.map((r) => {
    const otherUserId = r.user_id_1 === userId ? r.user_id_2 : r.user_id_1;
    return {
      rowId: r.id,
      otherUserId,
      otherName: profiles.get(otherUserId)?.full_name ?? 'Sem nome',
      otherAvatarUrl: profiles.get(otherUserId)?.avatar_url ?? null,
      preference: r.preference,
      status: r.status,
      isRequester: r.requested_by === userId,
    };
  });
}

/** Propõe uma preferência com outra pessoa — fica pendente até ela confirmar. */
export async function proposeFamilyRelationshipAction(
  orgId: string, otherUserId: string, preference: FamilyPreference,
): Promise<void> {
  const { supabase, userId } = await requireUser();
  if (otherUserId === userId) throw new Error('Não podes escolher a ti próprio.');
  const [user_id_1, user_id_2] = normalizePair(userId, otherUserId);

  const { error } = await supabase.from('family_relationships').insert({
    org_id: orgId, user_id_1, user_id_2, preference, requested_by: userId, status: 'pending',
  } as never);
  if (error) {
    if (error.code === '23505') throw new Error('Já existe uma preferência definida com essa pessoa — edita a que já existe.');
    throw new Error(error.message);
  }
}

/** Responde a uma proposta: aceita (passa a valer) ou recusa (desaparece). */
export async function respondToFamilyRelationshipAction(rowId: string, accept: boolean): Promise<void> {
  const { supabase } = await requireUser();
  if (accept) {
    const { error } = await supabase.from('family_relationships')
      .update({ status: 'accepted', updated_at: new Date().toISOString() } as never).eq('id', rowId);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from('family_relationships').delete().eq('id', rowId);
    if (error) throw new Error(error.message);
  }
}

/**
 * Muda a preferência de uma relação já existente — sempre volta a ficar
 * pendente, à espera que a outra pessoa confirme o novo valor.
 */
export async function updateFamilyRelationshipAction(rowId: string, preference: FamilyPreference): Promise<void> {
  const { supabase, userId } = await requireUser();
  const { error } = await supabase.from('family_relationships').update({
    preference, status: 'pending', requested_by: userId, updated_at: new Date().toISOString(),
  } as never).eq('id', rowId);
  if (error) throw new Error(error.message);
}

/** Remove a relação (qualquer um dos dois lados pode). */
export async function removeFamilyRelationshipAction(rowId: string): Promise<void> {
  const { supabase } = await requireUser();
  const { error } = await supabase.from('family_relationships').delete().eq('id', rowId);
  if (error) throw new Error(error.message);
}

/**
 * Todas as relações já CONFIRMADAS (os dois lados aceitaram) desta
 * organização — usado para sugerir/avisar na hora de montar a escala.
 * Devolve as duas direções de cada par, já com o nome da outra pessoa.
 */
export async function fetchOrgFamiliesAction(orgId: string): Promise<OrgFamilyLink[]> {
  const { supabase } = await requireUser();

  const { data: rows } = await supabase.from('family_relationships')
    .select('user_id_1, user_id_2, preference').eq('org_id', orgId).eq('status', 'accepted');
  const relationships = (rows ?? []) as { user_id_1: string; user_id_2: string; preference: FamilyPreference }[];
  if (relationships.length === 0) return [];

  const allIds = [...new Set(relationships.flatMap((r) => [r.user_id_1, r.user_id_2]))];
  const profiles = await profilesByIds(supabase, allIds);

  const links: OrgFamilyLink[] = [];
  for (const r of relationships) {
    links.push({ userId: r.user_id_1, otherUserId: r.user_id_2, otherName: profiles.get(r.user_id_2)?.full_name ?? 'Sem nome', preference: r.preference });
    links.push({ userId: r.user_id_2, otherUserId: r.user_id_1, otherName: profiles.get(r.user_id_1)?.full_name ?? 'Sem nome', preference: r.preference });
  }
  return links;
}
