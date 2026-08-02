/**
 * Layout partilhado por todos os emails de notificação.
 *
 * Regras de email HTML (não são as da web):
 *  · tabelas em vez de flex/grid — o Outlook não suporta layout moderno
 *  · estilos inline — muitos clientes removem <style>
 *  · sempre com fallback em texto simples
 */

export const APP_NAME = 'WIS - Services';
export const APP_URL = 'https://wis-services.com';
export const SUPPORT_EMAIL = 'support@wis-services.com';
export const CONTACT_EMAIL = 'contact@wis-services.com';
export const FROM = `${APP_NAME} <notifications@wis-services.com>`;

const TEAL = '#1A6B5A';
const INK = '#1c1c22';
const MUTED = '#6b7280';
const BORDER = '#e5e7eb';

export interface LayoutOptions {
  title: string;
  /** Conteúdo já em HTML, colocado no corpo. */
  body: string;
  /** Botão principal (opcional). */
  cta?: { label: string; url: string };
}

export function renderLayout({ title, body, cta }: LayoutOptions): string {
  return `<!doctype html>
<html lang="pt">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
               style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid ${BORDER};">

          <!-- Cabeçalho -->
          <tr>
            <td style="background:${TEAL};padding:20px 24px;">
              <span style="color:#ffffff;font-size:16px;font-weight:700;letter-spacing:-0.01em;">
                ${APP_NAME}
              </span>
            </td>
          </tr>

          <!-- Corpo -->
          <tr>
            <td style="padding:28px 24px;color:${INK};font-size:15px;line-height:1.6;">
              ${body}
              ${cta ? renderButton(cta) : ''}
            </td>
          </tr>

          <!-- Rodapé -->
          <tr>
            <td style="padding:18px 24px;border-top:1px solid ${BORDER};color:${MUTED};font-size:12px;line-height:1.6;">
              <p style="margin:0 0 6px;">
                Recebeste este email porque estás numa equipa que usa o ${APP_NAME}.
              </p>
              <p style="margin:0 0 6px;">
                <a href="${APP_URL}/" style="color:${TEAL};text-decoration:underline;">Deixar de receber estes emails</a>
                &nbsp;·&nbsp;
                <a href="mailto:${SUPPORT_EMAIL}" style="color:${TEAL};text-decoration:underline;">Ajuda</a>
                &nbsp;·&nbsp;
                <a href="${APP_URL}/privacidade" style="color:${TEAL};text-decoration:underline;">Privacidade</a>
              </p>
              <p style="margin:0;color:#9ca3af;">
                Dúvidas sobre os teus dados: ${CONTACT_EMAIL}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function renderButton({ label, url }: { label: string; url: string }): string {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 4px;">
    <tr>
      <td style="background:${TEAL};border-radius:8px;">
        <a href="${url}"
           style="display:inline-block;padding:11px 22px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">
          ${escapeHtml(label)}
        </a>
      </td>
    </tr>
  </table>`;
}

/** Rodapé da versão em texto simples — mesma informação do HTML. */
export function textFooter(): string {
  return [
    '',
    '—',
    `Recebeste este email porque estás numa equipa que usa o ${APP_NAME}.`,
    `Deixar de receber: ${APP_URL}/`,
    `Ajuda: ${SUPPORT_EMAIL}`,
    `Privacidade: ${APP_URL}/privacidade`,
  ].join('\n');
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
