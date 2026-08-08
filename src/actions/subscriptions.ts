'use server';

import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { DEFAULT_PLAN, PLAN_LIST, type OrgSubscription, type PlanDef, type PlanKey } from '@/lib/plans';
import type { PlanLimitState, PlanResource } from '@/lib/plan-limits';
import { FREE_PLAN_STATE, type PlanFeature, type PlanState } from '@/lib/plan-features';

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
    expires_at: null, granted_by: null, note: null, has_stripe_customer: false,
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
    has_stripe_customer: !!row.stripe_customer_id,
  };
}

/**
 * Concede um plano a uma organização (concessão manual / "permissão dev").
 * Só pode ser feito por um super-admin da plataforma. Sem pagamento.
 *
 * Sem UI no ServiceFlow — chamado só via SQL/RPC direto ou por outra
 * ferramenta administrativa (ver AnalyticDashboard). Se o plano concedido
 * ficar abaixo do uso atual da org (ex.: dar Semente a uma org com 19
 * pessoas), a org fica `downgraded_locked`, tal como um cancelamento via
 * Stripe — o admin escolhe depois o que fica ativo.
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

  let locked = false;
  for (const resource of ['people', 'ministry', 'admin', 'leader'] as const) {
    const { data } = await admin.rpc('check_plan_limit', { p_org_id: orgId, p_resource_type: resource });
    const row = Array.isArray(data) ? data[0] : data;
    if (row && row.allowed === false) locked = true;
  }

  await admin.from('org_subscriptions').update({ status: locked ? 'downgraded_locked' : 'active' }).eq('org_id', orgId);
  if (!locked) {
    await admin.from('organizations').update({ active_ministry_ids: [], active_member_ids: [] }).eq('id', orgId);
  }
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

/** Estado dos quatro limites de uma vez (para o banner do dashboard e as Definições). */
export async function fetchPlanUsageAction(
  orgId: string,
): Promise<Record<PlanResource, PlanLimitState>> {
  const [people, ministry, admin, leader] = await Promise.all([
    fetchPlanLimitAction(orgId, 'people'),
    fetchPlanLimitAction(orgId, 'ministry'),
    fetchPlanLimitAction(orgId, 'admin'),
    fetchPlanLimitAction(orgId, 'leader'),
  ]);
  return { people, ministry, admin, leader };
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

// ── Catálogo público de planos (página /planos) ──────────────────────────────
// Leitura pública (RLS: "plans: leitura pública") — sem sessão. A tabela
// `plans` é a fonte de verdade; src/lib/plans.ts fica só como fallback caso
// a leitura falhe (ex.: rede), para a página nunca ficar em branco.

export async function fetchPublicPlansAction(): Promise<PlanDef[]> {
  const supabase = await createClient();
  // Os tipos gerados ainda não incluem `plans` (ver migração 022).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const from = supabase.from.bind(supabase) as any;
  const { data, error } = await from('plans')
    .select('slug, name, max_people, max_ministries, max_admins, max_leaders, price_monthly, price_annual, features, sort_order')
    .eq('is_active', true)
    .order('sort_order');

  if (error || !data || data.length === 0) return PLAN_LIST;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((row): PlanDef => ({
    key: row.slug as PlanKey,
    label: row.name,
    order: row.sort_order,
    maxPeople: row.max_people,
    maxMinistries: row.max_ministries,
    maxAdmins: row.max_admins,
    maxLeaders: row.max_leaders,
    priceMonthly: Number(row.price_monthly),
    priceAnnual: Number(row.price_annual),
    features: (row.features as string[] | null) ?? [],
  }));
}

/**
 * Para o botão "Assinar" da página pública /planos: se a pessoa já tiver
 * sessão e for admin de alguma organização, devolve o ID dessa organização
 * (a última visitada, ou a primeira em que é admin) — assim o botão pode
 * levar direto ao Checkout em vez de mandar sempre para o registo.
 * Devolve null para visitantes sem sessão (aí o botão vai para /register).
 */
export async function fetchMyAdminOrgIdAction(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = getAdmin();
  const { data: memberships } = await admin.from('organization_members')
    .select('org_id, role').eq('user_id', user.id).eq('is_active', true).eq('role', 'admin');
  const rows = (memberships ?? []) as { org_id: string; role: string }[];
  if (rows.length === 0) return null;

  const lastOrg = (await cookies()).get('sf_last_org')?.value;
  if (lastOrg && rows.some((r) => r.org_id === lastOrg)) return lastOrg;
  return rows[0].org_id;
}

// ── Funcionalidades do plano (gating booleano) ───────────────────────────────

/** Estado do plano da organização: nome, features incluídas e se é cortesia. */
export async function fetchPlanStateAction(orgId: string): Promise<PlanState> {
  const supabase = await createClient();
  // Os tipos gerados ainda não incluem esta RPC (ver migração 028).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rpc = supabase.rpc.bind(supabase) as any;

  const { data, error } = await rpc('org_plan_state', { p_org_id: orgId });
  if (error || !data) return FREE_PLAN_STATE;

  const d = data as Record<string, unknown>;
  return {
    slug: (d.slug as string) ?? FREE_PLAN_STATE.slug,
    name: (d.name as string) ?? FREE_PLAN_STATE.name,
    features: ((d.features as PlanFeature[]) ?? []),
    courtesy: !!d.courtesy,
    source: (d.source as string) ?? 'free',
    status: (d.status as string) ?? 'free',
    expiresAt: (d.expires_at as string | null) ?? null,
    billingCycle: (d.billing_cycle as string) ?? 'monthly',
  };
}
