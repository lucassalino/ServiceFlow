/**
 * URL base pública da aplicação (usada em convites, partilha, WhatsApp, etc.).
 *
 * Para usar um domínio próprio, define a variável de ambiente
 * NEXT_PUBLIC_APP_URL (ex.: https://oteudominio.com) nas definições de build
 * do Cloudflare e faz um novo deploy. Enquanto não estiver definida, usa o
 * domínio .workers.dev por omissão.
 */
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || 'https://serviceflow.it-workdeveloper.workers.dev';
