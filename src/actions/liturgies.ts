'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import type { Liturgy, LiturgyMoment } from '@/types/models';
import type { Database } from '@/types/database';

function getAdmin() {
  return createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

async function requireAdminOrLeader(orgId: string, userId: string) {
  const admin = getAdmin();
  const { data: membership } = await admin
    .from('organization_members').select('role')
    .eq('org_id', orgId).eq('user_id', userId).maybeSingle();
  const role = (membership as { role?: string } | null)?.role;
  if (role !== 'admin' && role !== 'leader') {
    throw new Error('Só admins e líderes podem gerir os roteiros de culto');
  }
}

/** Limita o JSONB dos momentos ao formato esperado (defensivo contra dados antigos/malformados). */
function sanitizeMoments(moments: LiturgyMoment[]): LiturgyMoment[] {
  return (moments ?? []).map((m): LiturgyMoment => ({
    nome: String(m.nome ?? '').trim(),
    tipo: m.tipo === 'video' || m.tipo === 'projecao' ? m.tipo : 'pessoa',
    responsavel: String(m.responsavel ?? '').trim(),
    duracao: String(m.duracao ?? '').trim(),
    obs: String(m.obs ?? '').trim(),
    palavraTema: String(m.palavraTema ?? '').trim(),
    palavraTexto: String(m.palavraTexto ?? '').trim(),
    musicas: (m.musicas ?? []).map((x) => String(x).trim()).filter(Boolean),
    avisos: (m.avisos ?? []).map((x) => String(x).trim()).filter(Boolean),
  })).filter((m) => m.nome.length > 0);
}

export async function fetchLiturgiesAction(orgId: string): Promise<Liturgy[]> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  const admin = getAdmin();

  const { data: membership } = await admin
    .from('organization_members').select('id')
    .eq('org_id', orgId).eq('user_id', user.id).maybeSingle();
  if (!membership) throw new Error('Não pertences a esta organização');

  const { data, error } = await admin
    .from('liturgies')
    .select('*, profile:profiles!liturgies_created_by_fkey(*)')
    .eq('org_id', orgId)
    .order('date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data as unknown as Liturgy[];
}

export interface LiturgyPayload {
  name: string;
  date: string | null;
  theme: string;
  key_verse: string;
  moments: LiturgyMoment[];
}

export async function createLiturgyAction(orgId: string, payload: LiturgyPayload): Promise<Liturgy> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  await requireAdminOrLeader(orgId, user.id);
  const admin = getAdmin();
  const { data, error } = await admin.from('liturgies')
    .insert({
      org_id: orgId,
      name: payload.name.trim() || 'Sem título',
      date: payload.date || null,
      theme: payload.theme.trim(),
      key_verse: payload.key_verse.trim(),
      moments: sanitizeMoments(payload.moments) as unknown as Database['public']['Tables']['liturgies']['Insert']['moments'],
      created_by: user.id,
    })
    .select().single();
  if (error) throw new Error(error.message);
  return data as unknown as Liturgy;
}

export async function updateLiturgyAction(id: string, payload: LiturgyPayload): Promise<void> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  const admin = getAdmin();
  const { data: existing } = await admin.from('liturgies').select('org_id').eq('id', id).single();
  if (!existing) throw new Error('Roteiro não encontrado');
  await requireAdminOrLeader((existing as { org_id: string }).org_id, user.id);
  const { error } = await admin.from('liturgies')
    .update({
      name: payload.name.trim() || 'Sem título',
      date: payload.date || null,
      theme: payload.theme.trim(),
      key_verse: payload.key_verse.trim(),
      moments: sanitizeMoments(payload.moments) as unknown as Database['public']['Tables']['liturgies']['Update']['moments'],
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteLiturgyAction(id: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  const admin = getAdmin();
  const { data: existing } = await admin.from('liturgies').select('org_id').eq('id', id).single();
  if (!existing) throw new Error('Roteiro não encontrado');
  await requireAdminOrLeader((existing as { org_id: string }).org_id, user.id);
  const { error } = await admin.from('liturgies').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
