import type Stripe from 'stripe';

/**
 * Cliente Stripe (servidor). Segue o mesmo padrão do resto do repo:
 * chave lida de `process.env` (nunca `getCloudflareContext()`), populada em
 * produção pelos Secrets do Worker.
 *
 * NUNCA importar este ficheiro num Client Component — a chave é secreta.
 *
 * O import do SDK é feito dentro de getStripe() (dynamic import), não no
 * topo do ficheiro. O @opennextjs/cloudflare compila a app inteira num só
 * Worker — um `import` estático do pacote `stripe` (grande) carregava-o no
 * arranque de TODAS as rotas, mesmo as que nunca tocam em Stripe, e isso
 * chegou a estourar o limite de CPU do Worker em `/` e `/planos`. Com
 * dynamic import, só é avaliado quando uma rota o invoca mesmo.
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
export async function getStripe(): Promise<Stripe> {
  if (cached) return cached;
  const { default: Stripe } = await import('stripe');
  cached = new Stripe(getStripeSecretKey(), {
    // Fixar a versão evita que uma atualização silenciosa da conta Stripe
    // mude a forma dos webhooks que já tratamos.
    apiVersion: '2026-07-29.dahlia',
    typescript: true,
    // O cliente HTTP por omissão do SDK usa o módulo `https` do Node, que não
    // funciona no runtime do Cloudflare Workers — só sockets via `fetch`. Sem
    // isto, qualquer chamada à API falha com "connection to Stripe" e retries.
    httpClient: Stripe.createFetchHttpClient(),
  });
  return cached;
}

/** true se a chave estiver configurada — para a UI degradar sem rebentar. */
export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}
