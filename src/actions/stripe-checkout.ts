'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { getStripe, isStripeConfigured } from '@/lib/stripe/client';
import { getPlan, type PlanKey, type Currency } from '@/lib/plans';
import { APP_URL } from '@/lib/app-url';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getAdmin(): any {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

async function requireOrgAdmin(orgId: string) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Sessão expirada');

  const admin = getAdmin();
  const { data } = await admin.from('organization_members')
    .select('role').eq('org_id', orgId).eq('user_id', user.id).eq('is_active', true).single();
  if (!data || data.role !== 'admin') {
    throw new Error('Só um administrador da organização pode gerir a assinatura.');
  }
  return { user, admin };
}

export type PortalResult =
  | { ok: true; url: string }
  | { ok: false; reason: 'NO_SUBSCRIPTION' | 'FORBIDDEN' | 'UNKNOWN'; message: string };

/**
 * Cria uma Billing Portal Session para a organização gerir a assinatura
 * (mudar de plano, cartão, cancelar). Só faz sentido se a org já tiver um
 * customer no Stripe (i.e. já passou por um checkout).
 */
export async function createBillingPortalSessionAction(orgId: string): Promise<PortalResult> {
  if (!isStripeConfigured()) {
    return { ok: false, reason: 'NO_SUBSCRIPTION', message: 'Pagamentos ainda não estão configurados.' };
  }

  let admin;
  try {
    ({ admin } = await requireOrgAdmin(orgId));
  } catch (e) {
    return { ok: false, reason: 'FORBIDDEN', message: e instanceof Error ? e.message : 'Sem permissão.' };
  }

  const { data: sub } = await admin.from('org_subscriptions')
    .select('stripe_customer_id').eq('org_id', orgId).single();
  if (!sub?.stripe_customer_id) {
    return { ok: false, reason: 'NO_SUBSCRIPTION', message: 'Esta organização ainda não tem uma assinatura paga.' };
  }

  const stripe = await getStripe();
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${APP_URL}/`,
    });
    return { ok: true, url: session.url };
  } catch (e) {
    return { ok: false, reason: 'UNKNOWN', message: e instanceof Error ? e.message : 'Falha ao abrir o portal de faturação.' };
  }
}

export type CheckoutResult =
  | { ok: true; url: string }
  | { ok: false; reason: 'STRIPE_NOT_CONFIGURED' | 'PLAN_NOT_PAYABLE' | 'FORBIDDEN' | 'UNKNOWN'; message: string };

/**
 * Cria uma Stripe Checkout Session para a organização assinar `plan` no
 * ciclo `cycle`. Reutiliza o customer existente em `org_subscriptions`
 * (nunca cria um segundo customer para a mesma org).
 */
export async function createCheckoutSessionAction(
  orgId: string, plan: PlanKey, cycle: 'monthly' | 'annual', currency: Currency = 'EUR',
): Promise<CheckoutResult> {
  if (!isStripeConfigured()) {
    return { ok: false, reason: 'STRIPE_NOT_CONFIGURED', message: 'Pagamentos ainda não estão configurados.' };
  }

  let user, admin;
  try {
    ({ user, admin } = await requireOrgAdmin(orgId));
  } catch (e) {
    return { ok: false, reason: 'FORBIDDEN', message: e instanceof Error ? e.message : 'Sem permissão.' };
  }

  const planDef = getPlan(plan);
  if (planDef.priceMonthly === 0) {
    return { ok: false, reason: 'PLAN_NOT_PAYABLE', message: 'O plano Semente é grátis, não precisa de checkout.' };
  }

  const { data: planRow } = await admin.from('plans')
    .select('stripe_price_id_monthly, stripe_price_id_annual, stripe_price_id_monthly_brl, stripe_price_id_annual_brl')
    .eq('slug', plan).single();
  const priceId = currency === 'BRL'
    ? (cycle === 'monthly' ? planRow?.stripe_price_id_monthly_brl : planRow?.stripe_price_id_annual_brl)
    : (cycle === 'monthly' ? planRow?.stripe_price_id_monthly : planRow?.stripe_price_id_annual);
  if (!priceId) {
    return { ok: false, reason: 'PLAN_NOT_PAYABLE', message: 'Este plano ainda não tem preço configurado no Stripe.' };
  }

  const { data: org } = await admin.from('organizations').select('name').eq('id', orgId).single();
  const { data: sub } = await admin.from('org_subscriptions')
    .select('stripe_customer_id, source').eq('org_id', orgId).single();

  // Orgs com plano de cortesia (concessão manual) não passam pelo Stripe.
  if (sub?.source === 'manual') {
    return { ok: false, reason: 'PLAN_NOT_PAYABLE', message: 'Esta organização tem um plano de cortesia — contacta o suporte para mudar.' };
  }

  let stripe;
  try {
    stripe = await getStripe();
  } catch (e) {
    return { ok: false, reason: 'STRIPE_NOT_CONFIGURED', message: e instanceof Error ? e.message : 'Stripe não está configurado.' };
  }

  let customerId: string | undefined = sub?.stripe_customer_id ?? undefined;
  if (!customerId) {
    try {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        name: org?.name ?? undefined,
        metadata: { org_id: orgId },
      });
      customerId = customer.id;
      await admin.from('org_subscriptions').upsert({
        org_id: orgId,
        stripe_customer_id: customerId,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'org_id' });
    } catch (e) {
      return { ok: false, reason: 'UNKNOWN', message: e instanceof Error ? e.message : 'Falha ao criar o cliente no Stripe.' };
    }
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${APP_URL}/checkout/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/planos`,
      client_reference_id: orgId,
      subscription_data: {
        metadata: { org_id: orgId, plan, cycle, currency },
      },
      metadata: { org_id: orgId, plan, cycle, currency },
    });
    if (!session.url) {
      return { ok: false, reason: 'UNKNOWN', message: 'O Stripe não devolveu um URL de checkout.' };
    }
    return { ok: true, url: session.url };
  } catch (e) {
    return { ok: false, reason: 'UNKNOWN', message: e instanceof Error ? e.message : 'Falha ao criar o checkout.' };
  }
}
