/**
 * Cria (ou reutiliza) os Produtos e Preços do Stripe para os planos pagos do
 * WIS, em modo teste, e imprime os Price IDs para colar em `plans`.
 *
 * O Semente é grátis e não passa por checkout — por isso NÃO cria preço
 * para ele. Só Broto, Colheita e Celeiro × mensal/anual = 6 preços.
 *
 * Uso:
 *   node --env-file=.env.local scripts/stripe-seed.mjs
 *
 * Idempotente: se já existir um produto com o mesmo metadata.slug, reutiliza-o
 * em vez de duplicar. Podes correr o script várias vezes sem medo.
 */

import Stripe from 'stripe';

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error('STRIPE_SECRET_KEY não encontrada. Confirma o .env.local e corre com --env-file=.env.local.');
  process.exit(1);
}
if (!key.startsWith('sk_test_')) {
  console.error('Esta chave não é de modo TESTE (não começa por sk_test_). Por segurança, o script recusa-se a correr com uma chave sk_live_.');
  process.exit(1);
}

const stripe = new Stripe(key, { apiVersion: '2026-07-29.dahlia' });

// Preços em cêntimos (EUR). Têm de bater certo com `plans.price_monthly/annual`.
const PAID_PLANS = [
  { slug: 'broto',    name: 'Broto',    monthly: 999,  annual: 9990,  description: '25 pessoas · 5 ministérios · 1 admin' },
  { slug: 'colheita', name: 'Colheita', monthly: 1999, annual: 19990, description: '60 pessoas · ministérios ilimitados · 3 admins' },
  { slug: 'celeiro',  name: 'Celeiro',  monthly: 3999, annual: 39990, description: 'Pessoas e admins ilimitados' },
];

async function findExistingProduct(slug) {
  const list = await stripe.products.list({ limit: 100 });
  return list.data.find((p) => p.metadata?.slug === slug) ?? null;
}

async function findExistingPrice(productId, cycle) {
  const list = await stripe.prices.list({ product: productId, limit: 100 });
  return list.data.find((p) => p.metadata?.cycle === cycle) ?? null;
}

async function ensureProduct(plan) {
  const existing = await findExistingProduct(plan.slug);
  if (existing) return existing;
  return stripe.products.create({
    name: `WIS — ${plan.name}`,
    description: plan.description,
    metadata: { slug: plan.slug },
  });
}

async function ensurePrice(product, plan, cycle) {
  const existing = await findExistingPrice(product.id, cycle);
  if (existing) return existing;
  const unitAmount = cycle === 'monthly' ? plan.monthly : plan.annual;
  return stripe.prices.create({
    product: product.id,
    currency: 'eur',
    unit_amount: unitAmount,
    recurring: { interval: cycle === 'monthly' ? 'month' : 'year' },
    metadata: { slug: plan.slug, cycle },
  });
}

async function main() {
  console.log('A criar/verificar produtos e preços no Stripe (modo teste)…\n');
  const results = [];

  for (const plan of PAID_PLANS) {
    const product = await ensureProduct(plan);
    const monthly = await ensurePrice(product, plan, 'monthly');
    const annual = await ensurePrice(product, plan, 'annual');
    results.push({ slug: plan.slug, monthly: monthly.id, annual: annual.id });
    console.log(`✓ ${plan.name.padEnd(10)} mensal=${monthly.id}  anual=${annual.id}`);
  }

  console.log('\n--- SQL para colar (ou deixa que o agente aplique por ti) ---\n');
  for (const r of results) {
    console.log(
      `update public.plans set stripe_price_id_monthly='${r.monthly}', stripe_price_id_annual='${r.annual}' where slug='${r.slug}';`,
    );
  }
}

main().catch((err) => {
  console.error('Falhou:', err.message);
  process.exit(1);
});
