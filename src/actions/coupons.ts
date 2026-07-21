'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { getPlan, type PlanKey } from '@/lib/plans';

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function requirePlatformAdmin(admin: any, userId: string) {
  const { data } = await admin.from('profiles').select('is_platform_admin').eq('id', userId).single();
  if (!data?.is_platform_admin) throw new Error('Sem permissão. Apenas o super-admin da plataforma.');
}

async function requireOrgAdmin(orgId: string, userId: string) {
  const admin = getAdmin();
  const { data } = await admin.from('organization_members')
    .select('role').eq('org_id', orgId).eq('user_id', userId).eq('is_active', true).single();
  if (!data || data.role !== 'admin') throw new Error('Só um administrador da organização pode fazer isto.');
}

export interface Coupon {
  id: string;
  code: string;
  plan: PlanKey;
  duration_days: number | null;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  active: boolean;
  note: string | null;
  created_at: string;
}

// ── Resgate (admin da org) ───────────────────────────────────────────────────

export async function redeemCouponAction(orgId: string, code: string): Promise<{ plan: PlanKey; expiresAt: string | null }> {
  const user = await requireUser();
  await requireOrgAdmin(orgId, user.id);
  const admin = getAdmin();

  const clean = code.trim().toUpperCase();
  if (!clean) throw new Error('Escreve um código');

  const { data: coupon } = await admin.from('coupons').select('*').eq('code', clean).single();
  if (!coupon || !coupon.active) throw new Error('Código inválido ou inativo');
  if (coupon.expires_at && new Date(coupon.expires_at).getTime() < Date.now()) throw new Error('Este código expirou');
  if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) throw new Error('Este código atingiu o limite de utilizações');

  // Já resgatado por esta org?
  const { data: already } = await admin.from('coupon_redemptions')
    .select('id').eq('coupon_id', coupon.id).eq('org_id', orgId).maybeSingle();
  if (already) throw new Error('Esta organização já usou este código');

  const expiresAt = coupon.duration_days
    ? new Date(Date.now() + coupon.duration_days * 86400000).toISOString()
    : null;

  const now = new Date().toISOString();
  const { error: subErr } = await admin.from('org_subscriptions').upsert({
    org_id: orgId, plan: coupon.plan, source: 'coupon', status: 'active',
    started_at: now, expires_at: expiresAt, granted_by: user.id,
    note: `Cupão ${clean}`, updated_at: now,
  }, { onConflict: 'org_id' });
  if (subErr) throw new Error(subErr.message);

  await admin.from('coupon_redemptions').insert({ coupon_id: coupon.id, org_id: orgId, redeemed_by: user.id });
  await admin.from('coupons').update({ used_count: coupon.used_count + 1 }).eq('id', coupon.id);

  return { plan: coupon.plan as PlanKey, expiresAt };
}

// ── Gestão (super-admin da plataforma) ───────────────────────────────────────

export async function listCouponsAction(): Promise<Coupon[]> {
  const user = await requireUser();
  const admin = getAdmin();
  await requirePlatformAdmin(admin, user.id);
  const { data } = await admin.from('coupons').select('*').order('created_at', { ascending: false });
  return (data ?? []) as Coupon[];
}

export async function createCouponAction(input: {
  code: string; plan: PlanKey; durationDays: number | null; maxUses: number | null; note?: string;
}): Promise<void> {
  const user = await requireUser();
  const admin = getAdmin();
  await requirePlatformAdmin(admin, user.id);

  const clean = input.code.trim().toUpperCase();
  if (!/^[A-Z0-9]{3,20}$/.test(clean)) throw new Error('Código: 3-20 letras/números (sem espaços)');
  getPlan(input.plan); // valida que o plano existe

  const { error } = await admin.from('coupons').insert({
    code: clean, plan: input.plan,
    duration_days: input.durationDays, max_uses: input.maxUses,
    note: input.note?.trim() || null, created_by: user.id,
  });
  if (error) {
    if (/duplicate key/i.test(error.message)) throw new Error('Já existe um cupão com esse código');
    throw new Error(error.message);
  }
}

export async function deleteCouponAction(id: string): Promise<void> {
  const user = await requireUser();
  const admin = getAdmin();
  await requirePlatformAdmin(admin, user.id);
  const { error } = await admin.from('coupons').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
