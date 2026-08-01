/**
 * Tipagem das variáveis de ambiente.
 *
 * No Worker (OpenNext/Cloudflare) estas chegam via `process.env`, populado a
 * partir dos vars/secrets configurados no painel — o mesmo padrão já usado
 * pelo SUPABASE_SERVICE_ROLE_KEY. Por isso não usamos getCloudflareContext().
 */
declare namespace NodeJS {
  interface ProcessEnv {
    /** URL público do projeto Supabase. */
    NEXT_PUBLIC_SUPABASE_URL: string;
    /** Chave anónima do Supabase — segura no cliente. */
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    /** Chave de serviço do Supabase. Só no servidor. Nunca no wrangler.jsonc. */
    SUPABASE_SERVICE_ROLE_KEY: string;
    /**
     * Chave da API do Resend. Só no servidor.
     * Opcional: sem ela o envio de emails é ignorado sem partir a app.
     */
    RESEND_API_KEY?: string;
    /**
     * Chave secreta do Stripe (modo teste: sk_test_..., produção: sk_live_...).
     * Só no servidor. Nunca no wrangler.jsonc.
     * Opcional em dev: sem ela, checkout/portal ficam desativados na UI.
     */
    STRIPE_SECRET_KEY?: string;
    /**
     * Segredo do endpoint de webhook do Stripe (whsec_...), para verificar a
     * assinatura de cada evento recebido. Um por ambiente (dev/prod têm
     * endpoints diferentes no Stripe, logo segredos diferentes).
     */
    STRIPE_WEBHOOK_SECRET?: string;
  }
}
