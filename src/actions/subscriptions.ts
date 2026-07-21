'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { getPlan, DEFAULT_PLAN, withinLimit, type OrgSubscription, type PlanKey } from '@/lib/plans';

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

// ── Helpers de enforcement (usados por outras server actions) ────────────────

async function orgPlanLimits(orgId: string) {
  const admin = getAdmin();
  const { data } = await admin.from('org_subscriptions').select('plan, expires_at, status').eq('org_id', orgId).single();
  const expired = data?.expires_at && new Date(data.expires_at).getTime() < Date.now();
  return getPlan(expired || !data ? DEFAULT_PLAN : data.plan);
}

/** Lança erro se adicionar mais uma pessoa ultrapassa o limite do plano. */
export async function assertCanAddPeople(orgId: string, howMany = 1): Promise<void> {
  const admin = getAdmin();
  const plan = await orgPlanLimits(orgId);
  if (plan.maxPeople === null) return;

  const { count: members } = await admin
    .from('organization_members').select('id', { count: 'exact', head: true })
    .eq('org_id', orgId).eq('is_active', true);
  const { count: invites } = await admin
    .from('organization_invites').select('id', { count: 'exact', head: true })
    .eq('org_id', orgId).is('accepted_at', null);

  const used = (members ?? 0) + (invites ?? 0);
  if (used + howMany > plan.maxPeople) {
    throw new Error(
      `O plano ${plan.label} permite até ${plan.maxPeople} pessoas (tens ${used}). Faz upgrade para adicionar mais.`,
    );
  }
}

/** Lança erro se criar mais um ministério ultrapassa o limite do plano. */
export async function assertCanAddMinistry(orgId: string): Promise<void> {
  const admin = getAdmin();
  const plan = await orgPlanLimits(orgId);
  if (plan.maxMinistries === null) return;

  const { count } = await admin
    .from('ministries').select('id', { count: 'exact', head: true }).eq('org_id', orgId);
  if (!withinLimit(count ?? 0, plan.maxMinistries)) {
    throw new Error(
      `O plano ${plan.label} permite até ${plan.maxMinistries} ministério(s). Faz upgrade para criar mais.`,
    );
  }
}
