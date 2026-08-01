'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { DEFAULT_PLAN, type OrgSubscription, type PlanKey } from '@/lib/plans';
import type { PlanLimitState, PlanResource } from '@/lib/plan-limits';

// Cliente admin (service role) — sem tipos gerados para as tabelas novas, por isso `any`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getAdmin(): any {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

async function requireUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Sessão expirada');
  return user;
}

/** Verdadeiro se o utilizador atual é super-admin da plataforma ("permissão dev"). */
export async function fetchIsPlatformAdminAction(): Promise<boolean> {
  const user = await requireUser();
  const admin = getAdmin();
  const { data } = await admin.from('profiles').select('is_platform_admin').eq('id', user.id).single();
  return !!data?.is_platform_admin;
}

/** Subscrição efetiva de uma org (cria/assume 'semente' grátis se não existir). */
export async function fetchOrgSubscriptionAction(orgId: string): Promise<OrgSubscription> {
  await requireUser();
  const admin = getAdmin();
  const { data } = await admin.from('org_subscriptions').select('*').eq('org_id', orgId).single();
  if (data) return normalize(data);
  return {
    id: 'default', org_id: orgId, plan: DEFAULT_PLAN, source: 'free',
    status: 'active', started_at: new Date(0).toISOString(),
    expires_at: null, granted_by: null, note: null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalize(row: any): OrgSubscription {
  const expired = row.expires_at && new Date(row.expires_at).getTime() < Date.now();
  return {
    id: row.id, org_id: row.org_id,
    plan: (expired ? DEFAULT_PLAN : row.plan) as PlanKey,
    source: row.source, status: expired ? 'expired' : row.status,
    started_at: row.started_at, expires_at: row.expires_at,
    granted_by: row.granted_by, note: row.note,
  };
}

/**
 * Concede um plano a uma organização (concessão manual / "permissão dev").
 * Só pode ser feito por um super-admin da plataforma. Sem pagamento.
 */
export async function grantPlanAction(
  orgId: string, plan: PlanKey, opts?: { note?: string; expiresAt?: string | null },
): Promise<void> {
  const user = await requireUser();
  const admin = getAdmin();

  const { data: me } = await admin.from('profiles').select('is_platform_admin').eq('id', user.id).single();
  if (!me?.is_platform_admin) throw new Error('Sem permissão. Apenas o super-admin da plataforma pode conceder planos.');

  const now = new Date().toISOString();
  const { error } = await admin.from('org_subscriptions').upsert({
    org_id: orgId,
    plan,
    source: 'manual',
    status: 'active',
    started_at: now,
    expires_at: opts?.expiresAt ?? null,
    granted_by: user.id,
    note: opts?.note ?? null,
    updated_at: now,
  }, { onConflict: 'org_id' });
  if (error) throw new Error(error.message);
}

// ── Limites do plano ─────────────────────────────────────────────────────────
// A lógica vive na RPC `check_plan_limit` (fonte única de verdade, partilhada
// com o banner de utilização). Estes helpers são apenas a ponte para o TS.

/** Estado do limite de um recurso numa organização. */
export async function fetchPlanLimitAction(
  orgId: string, resource: PlanResource,
): Promise<PlanLimitState> {
  const admin = getAdmin();
  const { data, error } = await admin.rpc('check_plan_limit', {
    p_org_id: orgId,
    p_resource_type: resource,
  });
  if (error) throw new Error(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  return {
    allowed: !!row?.allowed,
    used: row?.used ?? 0,
    limit: row?.limit ?? null,
    planSlug: row?.plan_slug ?? DEFAULT_PLAN,
    planName: row?.plan_name ?? 'Semente',
  };
}

/** Estado dos três limites de uma vez (para o banner do dashboard). */
export async function fetchPlanUsageAction(
  orgId: string,
): Promise<Record<PlanResource, PlanLimitState>> {
  const [people, ministry, admin] = await Promise.all([
    fetchPlanLimitAction(orgId, 'people'),
    fetchPlanLimitAction(orgId, 'ministry'),
    fetchPlanLimitAction(orgId, 'admin'),
  ]);
  return { people, ministry, admin };
}

/**
 * Verifica se ainda cabe mais um recurso. Uso interno das server actions —
 * devolve o estado para que quem chama possa retornar PLAN_LIMIT_REACHED
 * em vez de lançar (as mensagens de Error não sobrevivem em produção).
 */
export async function canAddResource(
  orgId: string, resource: PlanResource,
): Promise<PlanLimitState> {
  return fetchPlanLimitAction(orgId, resource);
}
