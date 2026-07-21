'use server';

import { createClient } from '@/lib/supabase/server';

export type UnavailabilityPeriod = 'manha' | 'tarde' | 'noite';
export type UnavailabilityKind = 'date_range' | 'weekly';

export interface UnavailabilityEntry {
  id: string;
  kind: UnavailabilityKind;
  startDate: string | null;
  endDate: string | null;
  weekday: number | null; // 0 = domingo … 6 = sábado
  period: UnavailabilityPeriod | null; // null = o dia todo
  reason: string | null;
}

type Row = {
  id: string; kind: string; start_date: string | null; end_date: string | null;
  weekday: number | null; period: string | null; reason: string | null;
};

function toEntry(r: Row, canSeeReason: boolean): UnavailabilityEntry {
  return {
    id: r.id, kind: r.kind as UnavailabilityKind,
    startDate: r.start_date, endDate: r.end_date,
    weekday: r.weekday, period: r.period as UnavailabilityPeriod | null,
    // O motivo é pessoal — só a própria pessoa e admin/líder o veem. Isto é redigido aqui (server-side),
    // porque RLS do Postgres só restringe linhas, não colunas: sem isto o motivo viajava sempre até ao browser.
    reason: canSeeReason ? r.reason : null,
  };
}

/** Quem está a pedir os dados: o seu id e se é admin/líder desta organização. */
async function getRequester(orgId: string): Promise<{ userId: string; isAdminOrLeader: boolean } | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: membership } = await supabase
    .from('organization_members').select('role')
    .eq('org_id', orgId).eq('user_id', user.id).maybeSingle();
  const role = (membership as { role?: string } | null)?.role;
  return { userId: user.id, isAdminOrLeader: role === 'admin' || role === 'leader' };
}

/** Indisponibilidades de uma pessoa específica, nesta organização. */
export async function fetchUnavailabilityAction(userId: string, orgId: string): Promise<UnavailabilityEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('member_unavailability')
    .select('id, kind, start_date, end_date, weekday, period, reason')
    .eq('user_id', userId).eq('org_id', orgId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);

  const requester = await getRequester(orgId);
  const canSeeReason = requester?.isAdminOrLeader === true || requester?.userId === userId;
  return ((data ?? []) as Row[]).map((r) => toEntry(r, canSeeReason));
}

/** Indisponibilidades de TODA a organização, agrupadas por user_id — todos veem QUE está indisponível; o motivo é só para admin/líder (ou a própria pessoa). */
export async function fetchOrgUnavailabilityAction(orgId: string): Promise<Record<string, UnavailabilityEntry[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('member_unavailability')
    .select('id, user_id, kind, start_date, end_date, weekday, period, reason')
    .eq('org_id', orgId);
  if (error) throw new Error(error.message);

  const requester = await getRequester(orgId);
  const map: Record<string, UnavailabilityEntry[]> = {};
  for (const r of (data ?? []) as (Row & { user_id: string })[]) {
    const canSeeReason = requester?.isAdminOrLeader === true || requester?.userId === r.user_id;
    (map[r.user_id] ??= []).push(toEntry(r, canSeeReason));
  }
  return map;
}

export interface AddUnavailabilityInput {
  kind: UnavailabilityKind;
  startDate?: string | null;
  endDate?: string | null;
  weekday?: number | null;
  period?: UnavailabilityPeriod | null;
  reason?: string | null;
}

export async function addUnavailabilityAction(orgId: string, entry: AddUnavailabilityInput): Promise<void> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');
  const { error } = await supabase.from('member_unavailability').insert({
    org_id: orgId,
    user_id: user.id,
    kind: entry.kind,
    start_date: entry.startDate ?? null,
    end_date: entry.endDate ?? null,
    weekday: entry.weekday ?? null,
    period: entry.period ?? null,
    reason: entry.reason || null,
  });
  if (error) throw new Error(error.message);
}

export async function removeUnavailabilityAction(id: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Sessão expirada');

  // Só o próprio ou um admin podem remover (RLS reforça o mesmo, isto dá uma mensagem melhor).
  const { data: row, error: fetchError } = await supabase
    .from('member_unavailability').select('user_id, org_id').eq('id', id).single();
  if (fetchError || !row) throw new Error('Registo não encontrado');
  if (row.user_id !== user.id) {
    const { data: membership } = await supabase
      .from('organization_members').select('role')
      .eq('org_id', row.org_id).eq('user_id', user.id).maybeSingle();
    if ((membership as { role?: string } | null)?.role !== 'admin') {
      throw new Error('Sem permissão para remover');
    }
  }

  const { error } = await supabase.from('member_unavailability').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
