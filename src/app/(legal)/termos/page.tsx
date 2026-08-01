import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Termos de Uso · WIS - Services',
  description: 'Termos de uso do WIS - Services.',
};

const CONTACT_EMAIL = 'contact@wis-services.com';
const SUPPORT_EMAIL = 'support@wis-services.com';

/**
 * Termos de uso — conteúdo genérico/placeholder, a rever com aconselhamento
 * jurídico antes da submissão às lojas (App Store / Google Play) e de uma
 * utilização comercial alargada. Fica linkado no rodapé, no checkout do
 * Stripe e nas fichas das lojas.
 */
export default function TermosPage() {
  return (
    <>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
        Termos de Uso
      </h1>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginBottom: '2rem' }}>
        Última atualização: agosto de 2026
      </p>

      <S title="Aceitação dos termos">
        Ao criar uma conta ou usar o <strong>WIS - Services</strong> ("WIS"), aceitas
        estes termos. Se não concordares, não deves usar a aplicação.
      </S>

      <S title="O que é o serviço">
        O WIS é uma aplicação de gestão de ministérios de igreja — escalas, eventos e
        repertório — fornecida como PWA, acessível pelo navegador e instalável no ecrã
        inicial do dispositivo.
      </S>

      <S title="Contas e organizações">
        <ul style={ulStyle}>
          <li>És responsável por manter a tua conta e palavra-passe seguras.</li>
          <li>Cada organização (igreja/campus) tem os seus próprios dados, membros e assinatura.</li>
          <li>Quem cria a organização começa como administrador e pode convidar outras pessoas.</li>
        </ul>
      </S>

      <S title="Planos e pagamento">
        <ul style={ulStyle}>
          <li>O plano Semente é gratuito, com limites de pessoas, ministérios e administradores.</li>
          <li>Os planos pagos são cobrados de forma recorrente (mensal ou anual) através do Stripe.</li>
          <li>Podes cancelar a qualquer momento; a organização volta ao plano Semente no fim do período pago, sem perda de dados.</li>
          <li>Se, ao voltar ao Semente, a organização tiver mais pessoas ou ministérios do que o plano permite, pedimos para escolheres o que fica ativo — nada é apagado.</li>
        </ul>
      </S>

      <S title="Uso aceitável">
        Não podes usar o WIS para fins ilegais, para assediar terceiros, ou para tentar
        aceder a dados de outra organização. Reservamo-nos o direito de suspender contas
        que violem estes termos.
      </S>

      <S title="Disponibilidade do serviço">
        Fazemos o possível para manter o serviço disponível, mas não garantimos
        funcionamento ininterrupto. Podem existir manutenções ou indisponibilidades
        pontuais.
      </S>

      <S title="Propriedade e conteúdo">
        Os dados que introduzes (escalas, repertório, informação de membros) são teus.
        O software, a marca e o design do WIS são propriedade do WIS - Services.
      </S>

      <S title="Alterações aos termos">
        Podemos atualizar estes termos. Alterações relevantes serão comunicadas por
        email ou dentro da aplicação.
      </S>

      <S title="Contactos">
        Dúvidas sobre estes termos: <A href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</A><br />
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
