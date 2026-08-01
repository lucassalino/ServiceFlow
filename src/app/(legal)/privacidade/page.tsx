import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidade · WIS - Services',
  description: 'Como o WIS - Services trata os teus dados pessoais.',
};

const CONTACT_EMAIL = 'contact@wis-services.com';
const SUPPORT_EMAIL = 'support@wis-services.com';

/**
 * Política de privacidade — ponto de contacto RGPD.
 *
 * NOTA: este texto descreve o tratamento de dados tal como a aplicação o faz
 * hoje. Não é aconselhamento jurídico; convém ser revisto por quem de direito
 * antes de uma utilização comercial alargada.
 */
export default function PrivacidadePage() {
  return (
    <>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
        Política de Privacidade
      </h1>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginBottom: '2rem' }}>
        Última atualização: agosto de 2026
      </p>

      <S title="Quem somos">
        O <strong>WIS - Services</strong> é uma aplicação de gestão de escalas para
        equipas de igrejas. Para qualquer questão sobre os teus dados, escreve para{' '}
        <A href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</A>.
      </S>

      <S title="Que dados recolhemos">
        <ul style={ulStyle}>
          <li><strong>Conta:</strong> nome, email e palavra-passe (guardada cifrada pelo Supabase Auth).</li>
          <li><strong>Perfil (opcional):</strong> telemóvel, data de nascimento e fotografia.</li>
          <li><strong>Participação:</strong> ministérios, funções, escalas, confirmações e indisponibilidades.</li>
          <li><strong>Técnicos:</strong> registos de acesso e de envio de emails, para segurança e diagnóstico.</li>
        </ul>
      </S>

      <S title="Para que usamos os dados">
        Exclusivamente para o funcionamento da aplicação: montar escalas, avisar-te
        quando és escalado, e permitir à tua equipa coordenar-se.{' '}
        <strong>Não vendemos dados nem os usamos para publicidade.</strong>
      </S>

      <S title="Quem vê o quê">
        <ul style={ulStyle}>
          <li>Os membros da tua organização veem o teu nome, foto, ministérios e escalas.</li>
          <li>O <strong>motivo</strong> de uma indisponibilidade só é visível para ti e para administradores/líderes.</li>
          <li>O teu histórico de participações só é visível para ti e para administradores/líderes.</li>
          <li>Organizações diferentes não veem os dados umas das outras.</li>
        </ul>
      </S>

      <S title="Subcontratantes">
        <ul style={ulStyle}>
          <li><strong>Supabase</strong> — base de dados, autenticação e ficheiros.</li>
          <li><strong>Cloudflare</strong> — alojamento e entrega da aplicação.</li>
          <li><strong>Resend</strong> — envio dos emails de notificação.</li>
        </ul>
      </S>

      <S title="Emails">
        Enviamos emails quando és escalado. Podes desligá-los a qualquer momento nas
        Definições, ou pelo link no rodapé de cada email. Os emails de conta
        (recuperar palavra-passe, confirmar email) são necessários ao serviço e não
        podem ser desligados.
      </S>

      <S title="Durante quanto tempo guardamos">
        Enquanto a tua conta existir. Se saíres de uma organização, o histórico de
        participação nessa organização é removido. Se apagares a conta, os dados
        pessoais são eliminados.
      </S>

      <S title="Os teus direitos">
        Tens direito a aceder, corrigir, apagar e exportar os teus dados, e a opor-te
        ao tratamento. Para exercer qualquer um deles, escreve para{' '}
        <A href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</A> — respondemos no prazo
        legal de 30 dias. Grande parte destas ações podes fazê-las diretamente nas
        Definições da aplicação.
      </S>

      <S title="Contactos">
        Privacidade e dados: <A href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</A><br />
        Ajuda e problemas: <A href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</A>
      </S>
    </>
  );
}

const ulStyle: React.CSSProperties = {
  margin: '0.5rem 0 0', paddingLeft: '1.1rem',
  display: 'flex', flexDirection: 'column', gap: '0.4rem',
};

function S({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: '2rem' }}>
      <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.5rem' }}>{title}</h2>
      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', lineHeight: 1.75 }}>
        {children}
      </div>
    </section>
  );
}

function A({ href, children }: { href: string; children: React.ReactNode }) {
  return <a href={href} style={{ color: '#8fd0ea', textDecoration: 'underline' }}>{children}</a>;
}
