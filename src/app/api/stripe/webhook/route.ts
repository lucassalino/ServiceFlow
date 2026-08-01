import { createClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe/client';
import { DEFAULT_PLAN } from '@/lib/plans';

/**
 * Webhook do Stripe. Assinatura verificada com STRIPE_WEBHOOK_SECRET —
 * NUNCA confiar no corpo sem verificar (qualquer um pode fazer POST aqui).
 *
 * Eventos tratados:
 *  - checkout.session.completed   → ativa o plano pago na org
 *  - customer.subscription.updated → sincroniza plano/ciclo/estado
 *  - customer.subscription.deleted → marca como cancelada (downgrade completo é a Tarefa 5)
 *  - invoice.payment_failed        → marca past_due
 *  - invoice.payment_succeeded     → volta a active se estava past_due
 *
 * Nunca mexe em org_subscriptions com source='manual' (planos de cortesia).
 */

export const dynamic = 'force-dynamic';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getAdmin(): any {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function alreadyProcessed(admin: any, eventId: string): Promise<boolean> {
  const { data } = await admin.from('stripe_webhook_events').select('id').eq('id', eventId).maybeSingle();
  return !!data;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function markProcessed(admin: any, event: Stripe.Event) {
  await admin.from('stripe_webhook_events').insert({ id: event.id, type: event.type });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function findOrgSubByCustomer(admin: any, customerId: string) {
  const { data } = await admin.from('org_subscriptions').select('*').eq('stripe_customer_id', customerId).maybeSingle();
  return data;
}

/** Descobre a que plano/ciclo pertence um price_id (comparando com a tabela `plans`). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function findPlanByPriceId(admin: any, priceId: string): Promise<{ slug: string; cycle: 'monthly' | 'annual' } | null> {
  const { data: monthly } = await admin.from('plans').select('slug').eq('stripe_price_id_monthly', priceId).maybeSingle();
  if (monthly) return { slug: monthly.slug, cycle: 'monthly' };
  const { data: annual } = await admin.from('plans').select('slug').eq('stripe_price_id_annual', priceId).maybeSingle();
  if (annual) return { slug: annual.slug, cycle: 'annual' };
  return null;
}

/** Traduz o status de subscrição do Stripe para o vocabulário interno. */
function mapStripeStatus(status: Stripe.Subscription.Status): 'active' | 'past_due' | 'canceled' {
  switch (status) {
    case 'active':
    case 'trialing':
      return 'active';
    case 'past_due':
    case 'unpaid':
    case 'incomplete':
      return 'past_due';
    default:
      return 'canceled';
  }
}

export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) {
    return new Response('Webhook não configurado', { status: 400 });
  }

  const body = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return new Response('Assinatura inválida', { status: 400 });
  }

  const admin = getAdmin();

  if (await alreadyProcessed(admin, event.id)) {
    return new Response('ok (duplicado)', { status: 200 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orgId = session.client_reference_id;
        if (!orgId || !session.customer || !session.subscription) break;

        const { data: existing } = await admin.from('org_subscriptions').select('source').eq('org_id', orgId).maybeSingle();
        if (existing?.source === 'manual') break; // nunca mexer em plano de cortesia

        const plan = (session.metadata?.plan as string) ?? DEFAULT_PLAN;
        const cycle = (session.metadata?.cycle as string) === 'annual' ? 'annual' : 'monthly';

        await admin.from('org_subscriptions').upsert({
          org_id: orgId,
          plan,
          source: 'stripe',
          status: 'active',
          billing_cycle: cycle,
          started_at: new Date().toISOString(),
          expires_at: null,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'org_id' });
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const sub = await findOrgSubByCustomer(admin, subscription.customer as string);
        if (!sub || sub.source === 'manual') break;

        const priceId = subscription.items.data[0]?.price?.id;
        const planInfo = priceId ? await findPlanByPriceId(admin, priceId) : null;

        await admin.from('org_subscriptions').update({
          status: mapStripeStatus(subscription.status),
          ...(planInfo ? { plan: planInfo.slug, billing_cycle: planInfo.cycle } : {}),
          stripe_subscription_id: subscription.id,
          updated_at: new Date().toISOString(),
        }).eq('org_id', sub.org_id);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const sub = await findOrgSubByCustomer(admin, subscription.customer as string);
        if (!sub || sub.source === 'manual') break;

        // Downgrade completo (voltar ao Semente, bloquear o excedente) é a
        // Tarefa 5 — por agora só registamos que a subscrição terminou.
        await admin.from('org_subscriptions').update({
          status: 'canceled',
          updated_at: new Date().toISOString(),
        }).eq('org_id', sub.org_id);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        if (!invoice.customer) break;
        const sub = await findOrgSubByCustomer(admin, invoice.customer as string);
        if (!sub || sub.source === 'manual') break;

        await admin.from('org_subscriptions').update({
          status: 'past_due',
          updated_at: new Date().toISOString(),
        }).eq('org_id', sub.org_id);
        // TODO: notificar o admin da org (email) quando o cliente de email
        // estiver ligado a este fluxo — ver AGENTS.md "Por fazer".
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        if (!invoice.customer) break;
        const sub = await findOrgSubByCustomer(admin, invoice.customer as string);
        if (!sub || sub.source === 'manual') break;
        if (sub.status !== 'past_due') break;

        await admin.from('org_subscriptions').update({
          status: 'active',
          updated_at: new Date().toISOString(),
        }).eq('org_id', sub.org_id);
        break;
      }

      default:
        break;
    }

    await markProcessed(admin, event);
    return new Response('ok', { status: 200 });
  } catch (err) {
    console.error('Erro a processar webhook Stripe', event.type, err);
    // Devolve 500 para o Stripe reenviar — não marcamos como processado.
    return new Response('erro interno', { status: 500 });
  }
}
