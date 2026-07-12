/**
 * Utilitários para gerar links wa.me (WhatsApp Click-to-Chat).
 * Abordagem sem API: a app gera a mensagem pronta e o utilizador toca para enviar.
 */

/** Remove tudo o que não seja dígito. Ex: "+351 900 000 000" → "351900000000". */
export function sanitizePhone(phone: string | null | undefined): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

/**
 * Constrói um link wa.me.
 * Se houver telemóvel, abre a conversa com essa pessoa; caso contrário abre
 * o WhatsApp e deixa o utilizador escolher o contacto.
 */
export function buildWhatsAppLink(phone: string | null | undefined, message: string): string {
  const number = sanitizePhone(phone);
  const text = encodeURIComponent(message);
  return number
    ? `https://wa.me/${number}?text=${text}`
    : `https://wa.me/?text=${text}`;
}

/** Formata uma data ISO (YYYY-MM-DD) para PT-PT legível: "12 de julho de 2026". */
export function formatDateLong(dateStr: string): string {
  try {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-PT', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/** Mensagem de aviso de escala para enviar por WhatsApp. */
export function scheduleMessage(opts: {
  name: string;
  orgName: string;
  ministry: string;
  eventName: string;
  date: string;
  time?: string | null;
  appUrl: string;
}): string {
  const firstName = opts.name.split(' ')[0] || opts.name;
  const when = `${formatDateLong(opts.date)}${opts.time ? ` às ${opts.time.slice(0, 5)}` : ''}`;
  const ministry = opts.ministry || opts.eventName;
  return (
    `Olá, *${firstName}*! 🙌\n\n` +
    `A *${opts.orgName}* escalou-te no *${ministry}* para o culto do dia *${when}*.\n\n` +
    `Para veres os detalhes da escala, cifras ou ficheiros, abre a app:\n${opts.appUrl}\n\n` +
    `Confirma a tua presença na app:\n` +
    `✅ Sim, confirmo\n` +
    `❌ Não poderei ir`
  );
}

/** Mensagem de convite para entrar numa organização. */
export function inviteMessage(opts: {
  orgName: string;
  inviteCode: string;
  joinUrl: string;
}): string {
  return (
    `Olá! 👋\n\n` +
    `Foste convidado(a) para *${opts.orgName}* no WIS - Services.\n\n` +
    `Entra aqui para te juntares:\n${opts.joinUrl}\n\n` +
    `Ou usa o código de convite: *${opts.inviteCode}*`
  );
}

/** Mensagem curta para a partilha nativa (Web Share) — foca no código. */
export function inviteShareText(orgName: string, code: string, appUrl: string): string {
  return (
    `Entra na organização "${orgName}" no WIS - Services!\n\n` +
    `Usa o código: ${code}\n\n` +
    `Abre a app em: ${appUrl}`
  );
}
