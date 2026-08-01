import Stripe from 'stripe';

/**
 * Cliente Stripe (servidor). Segue o mesmo padrão do resto do repo:
 * chave lida de `process.env` (nunca `getCloudflareContext()`), populada em
 * produção pelos Secrets do Worker.
 *
 * NUNCA importar este ficheiro num Client Component — a chave é secreta.
 */
function getStripeSecretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      'STRIPE_SECRET_KEY não está configurada. Em dev, adiciona-a ao .env.local; ' +
      'em produção é um Secret no Worker (Settings → Variables and Secrets).',
    );
  }
  return key;
}

let cached: Stripe | null = null;

/** Instância partilhada do SDK do Stripe. Lança se a chave não estiver configurada. */
export function getStripe(): Stripe {
  if (cached) return cached;
  cached = new Stripe(getStripeSecretKey(), {
    // Fixar a versão evita que uma atualização silenciosa da conta Stripe
    // mude a forma dos webhooks que já tratamos.
    apiVersion: '2026-07-29.dahlia',
    typescript: true,
  });
  return cached;
}

/** true se a chave estiver configurada — para a UI degradar sem rebentar. */
export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}
