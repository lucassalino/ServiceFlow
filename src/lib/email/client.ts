/**
 * Cliente mínimo da API do Resend.
 *
 * Usamos `fetch` em vez do SDK oficial de propósito: só precisamos de um
 * endpoint (POST /emails/batch) e o SDK traz dependências que não usamos
 * (parsing de email recebido, validação de webhooks). Isto mantém o bundle
 * do Worker enxuto — a Cloudflare limita-o a 3 MiB no plano gratuito.
 *
 * A chave é lida de `process.env`, o mesmo padrão já usado no resto do
 * projeto (ver SUPABASE_SERVICE_ROLE_KEY). No Worker, o OpenNext popula
 * process.env a partir dos Secrets configurados no painel.
 */

const RESEND_API = 'https://api.resend.com';

export interface ResendEmail {
  from: string;
  to: string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  headers?: Record<string, string>;
}

interface ResendBatchSuccess {
  data: { id: string }[];
}

interface ResendError {
  name?: string;
  message?: string;
}

export type ResendResult =
  | { ok: true; ids: string[] }
  | { ok: false; error: string };

/** true se a chave está configurada — permite degradar sem rebentar. */
export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

/**
 * Envia um lote de emails numa só chamada.
 * O Resend aceita até 100 mensagens por pedido.
 *
 * Nunca lança: devolve sempre um resultado tipado.
 */
export async function sendBatch(emails: ResendEmail[]): Promise<ResendResult> {
  if (emails.length === 0) return { ok: true, ids: [] };

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: 'RESEND_API_KEY não está configurada' };

  try {
    const res = await fetch(`${RESEND_API}/emails/batch`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        emails.map((e) => ({
          from: e.from,
          to: e.to,
          subject: e.subject,
          html: e.html,
          text: e.text,
          reply_to: e.replyTo,
          headers: e.headers,
        })),
      ),
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as ResendError | null;
      return {
        ok: false,
        error: body?.message ?? `Resend respondeu ${res.status}`,
      };
    }

    const body = (await res.json()) as ResendBatchSuccess;
    return { ok: true, ids: (body.data ?? []).map((d) => d.id) };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : 'Falha de rede ao contactar o Resend' };
  }
}

/** Limite de mensagens por pedido imposto pelo Resend. */
export const RESEND_BATCH_MAX = 100;
