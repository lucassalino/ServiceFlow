import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Suporte · WIS - Services',
  description: 'Ajuda e contacto do WIS - Services.',
};

const SUPPORT_EMAIL = 'support@wis-services.com';
const CONTACT_EMAIL = 'contact@wis-services.com';

const FAQ: { q: string; a: string }[] = [
  {
    q: 'Não recebi o email de convite. O que faço?',
    a: 'Verifica a pasta de spam. Se não estiver lá, pede ao administrador da tua igreja para reenviar o convite, ou entra com o código de convite da organização.',
  },
  {
    q: 'Como deixo de receber emails de escala?',
    a: 'Nas Definições, na secção "Notificações por email", desliga a opção. Os emails de conta (recuperar palavra-passe) continuam a ser enviados.',
  },
  {
    q: 'Como confirmo a minha presença numa escala?',
    a: 'Abre o evento na app e confirma. A equipa passa a ver que contas com essa data.',
  },
  {
    q: 'Marquei indisponibilidade e mesmo assim fui escalado.',
    a: 'A indisponibilidade é um aviso para quem escala, não um bloqueio. Fala com o teu líder — ele vê o aviso ao montar a escala.',
  },
  {
    q: 'Posso pertencer a mais do que uma igreja?',
    a: 'Sim. Podes entrar em várias organizações e trocar entre elas no menu do topo.',
  },
];

export default function SuportePage() {
  return (
    <>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
        Suporte
      </h1>
      <p style={{ color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, marginBottom: '2rem' }}>
        Estamos aqui para ajudar. Escreve-nos e respondemos assim que possível.
      </p>

      <div style={{
        padding: '1.25rem 1.5rem', borderRadius: '0.875rem', marginBottom: '2.5rem',
        background: 'rgba(26,107,90,0.12)', border: '1px solid rgba(26,107,90,0.3)',
      }}>
        <p style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.1em',
          color: 'rgba(255,255,255,0.45)', margin: '0 0 0.35rem', fontWeight: 700 }}>
          Dúvidas e problemas
        </p>
        <a href={`mailto:${SUPPORT_EMAIL}`}
          style={{ fontSize: '1.05rem', fontWeight: 600, color: '#5eead4', textDecoration: 'none' }}>
          {SUPPORT_EMAIL}
        </a>
      </div>

      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>
        Perguntas frequentes
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2.5rem' }}>
        {FAQ.map(({ q, a }) => (
          <div key={q} style={{
            padding: '1rem 1.25rem', borderRadius: '0.75rem',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <p style={{ fontSize: '0.9rem', fontWeight: 600, margin: '0 0 0.35rem' }}>{q}</p>
            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.65, margin: 0 }}>{a}</p>
          </div>
        ))}
      </div>

      <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>
        Para assuntos relacionados com dados pessoais e privacidade, usa{' '}
        <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: '#5eead4' }}>{CONTACT_EMAIL}</a>.
      </p>
    </>
  );
}
