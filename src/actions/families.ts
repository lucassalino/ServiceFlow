'use server';

import { createClient } from '@/lib/supabase/server';

export type FamilyPreference = 'junto' | 'separado' | 'indiferente';

export interface FamilyMemberInfo {
  rowId: string;
  userId: string;
  name: string;
  avatarUrl: string | null;
  status: 'pending' | 'accepted';
  isMe: boolean;
}

export interface MyFamily {
  id: string;
  preference: FamilyPreference;
  isCreator: boolean;
  members: FamilyMemberInfo[];
  /** Só definido quando a minha linha ainda está pendente. */
  myInvitedByName: string | null;
}

// `families`/`family_members` são tabelas novas, ainda sem tipos gerados
// (ver migração 047) — daí o `as any` no cliente devolvido aqui.
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

/** A minha família nesta organização (como criador ou como membro aceite/pendente), ou null. */
export async function fetchMyFamilyAction(orgId: string): Promise<MyFamily | null> {
  const { supabase, userId } = await requireUser();

  const { data: myRow } = await supabase.from('family_members')
    .select('family_id, status, invited_by').eq('org_id', orgId).eq('user_id', userId).maybeSingle();
  if (!myRow) return null;
  const my = myRow as { family_id: string; status: 'pending' | 'accepted'; invited_by: string };

  const familyId = my.family_id;
  const { data: family } = await supabase.from('families')
    .select('id, preference, created_by').eq('id', familyId).single();
  if (!family) return null;
  const f = family as { id: string; preference: FamilyPreference; created_by: string };

  const { data: rows } = await supabase.from('family_members')
    .select('id, user_id, status').eq('family_id', familyId).order('created_at');
  const memberRows = (rows ?? []) as { id: string; user_id: string; status: 'pending' | 'accepted' }[];
  const profiles = await profilesByIds(supabase, [...memberRows.map((m) => m.user_id), my.invited_by]);

  return {
    id: f.id,
    preference: f.preference,
    isCreator: f.created_by === userId,
    members: memberRows.map((m) => ({
      rowId: m.id,
      userId: m.user_id,
      name: profiles.get(m.user_id)?.full_name ?? 'Sem nome',
      avatarUrl: profiles.get(m.user_id)?.avatar_url ?? null,
      status: m.status,
      isMe: m.user_id === userId,
    })),
    myInvitedByName: my.status === 'pending' ? (profiles.get(my.invited_by)?.full_name ?? 'Alguém') : null,
  };
}

export interface OrgFamilyLink {
  userId: string;
  name: string;
  preference: FamilyPreference;
  /** Só os outros membros já ACEITES desta família (pendentes não contam para os avisos de escala). */
  partners: { userId: string; name: string }[];
}

/**
 * Todas as famílias já confirmadas (ambos os lados aceitaram) desta
 * organização — usado para sugerir/avisar na hora de montar a escala de um
 * evento. Membros ainda pendentes não entram aqui.
 */
export async function fetchOrgFamiliesAction(orgId: string): Promise<OrgFamilyLink[]> {
  const { supabase } = await requireUser();

  const { data: rows } = await supabase.from('family_members')
    .select('family_id, user_id').eq('org_id', orgId).eq('status', 'accepted');
  const members = (rows ?? []) as { family_id: string; user_id: string }[];
  if (members.length === 0) return [];

  const familyIds = [...new Set(members.map((m) => m.family_id))];
  const { data: families } = await supabase.from('families').select('id, preference').in('id', familyIds);
  const prefById = new Map<string, FamilyPreference>(
    (families ?? []).map((f: { id: string; preference: FamilyPreference }) => [f.id, f.preference]),
  );
  const profiles = await profilesByIds(supabase, members.map((m) => m.user_id));

  const byFamily = new Map<string, string[]>();
  for (const m of members) byFamily.set(m.family_id, [...(byFamily.get(m.family_id) ?? []), m.user_id]);

  return members.map((m) => ({
    userId: m.user_id,
    name: profiles.get(m.user_id)?.full_name ?? 'Sem nome',
    preference: prefById.get(m.family_id) ?? 'indiferente',
    partners: (byFamily.get(m.family_id) ?? [])
      .filter((uid) => uid !== m.user_id)
      .map((uid) => ({ userId: uid, name: profiles.get(uid)?.full_name ?? 'Sem nome' })),
  }));
}

/** Cria uma família com quem a está a criar (já aceite) e convida os outros (pendentes). */
export async function createFamilyAction(
  orgId: string, preference: FamilyPreference, memberUserIds: string[],
): Promise<void> {
  const { supabase, userId } = await requireUser();
  const invitees = [...new Set(memberUserIds)].filter((id) => id !== userId);
  if (invitees.length === 0) throw new Error('Escolhe pelo menos uma pessoa para convidar.');

  const { data: family, error } = await supabase.from('families')
    .insert({ org_id: orgId, preference, created_by: userId } as never).select('id').single();
  if (error) throw new Error(error.message);
  const familyId = (family as { id: string }).id;

  const { error: selfError } = await supabase.from('family_members')
    .insert({ family_id: familyId, org_id: orgId, user_id: userId, status: 'accepted', invited_by: userId } as never);
  if (selfError) throw new Error(selfError.message);

  const { error: inviteError } = await supabase.from('family_members').insert(
    invitees.map((uid) => ({ family_id: familyId, org_id: orgId, user_id: uid, status: 'pending', invited_by: userId })) as never,
  );
  if (inviteError) {
    if (inviteError.code === '23505') throw new Error('Uma das pessoas convidadas já faz parte de outra família nesta organização.');
    throw new Error(inviteError.message);
  }
}

/** O criador convida mais uma pessoa para a família já existente. */
export async function addFamilyMemberAction(familyId: string, orgId: string, userId: string): Promise<void> {
  const { supabase, userId: me } = await requireUser();
  const { error } = await supabase.from('family_members')
    .insert({ family_id: familyId, org_id: orgId, user_id: userId, status: 'pending', invited_by: me } as never);
  if (error) {
    if (error.code === '23505') throw new Error('Esta pessoa já faz parte de outra família nesta organização.');
    throw new Error(error.message);
  }
}

/** Responde a um convite de família: aceita (fica visível para todos) ou recusa (o convite desaparece). */
export async function respondToFamilyInviteAction(rowId: string, accept: boolean): Promise<void> {
  const { supabase } = await requireUser();
  if (accept) {
    const { error } = await supabase.from('family_members').update({ status: 'accepted' } as never).eq('id', rowId);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from('family_members').delete().eq('id', rowId);
    if (error) throw new Error(error.message);
  }
}

/** Remove um membro da família (o próprio a sair, ou o criador a remover alguém). */
export async function removeFamilyMemberAction(rowId: string): Promise<void> {
  const { supabase } = await requireUser();
  const { error } = await supabase.from('family_members').delete().eq('id', rowId);
  if (error) throw new Error(error.message);
}

/** Só o criador pode mudar a preferência da família. */
export async function updateFamilyPreferenceAction(familyId: string, preference: FamilyPreference): Promise<void> {
  const { supabase } = await requireUser();
  const { error } = await supabase.from('families')
    .update({ preference, updated_at: new Date().toISOString() } as never).eq('id', familyId);
  if (error) throw new Error(error.message);
}

/** Só o criador pode desfazer a família por completo. */
export async function disbandFamilyAction(familyId: string): Promise<void> {
  const { supabase } = await requireUser();
  const { error } = await supabase.from('families').delete().eq('id', familyId);
  if (error) throw new Error(error.message);
}
