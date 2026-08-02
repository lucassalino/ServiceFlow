'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CalendarCheck, Music2, Users, Bell,
  CalendarSync, ListChecks, Plus, ExternalLink, Sparkles,
  ListMusic, UserCheck, Clock, Layers, LayoutGrid, Building2, Globe,
} from 'lucide-react';
import { annualSavingsPercent, type PlanDef } from '@/lib/plans';
import { APP_URL } from '@/lib/app-url';
import { SUPPORT_EMAIL } from '@/lib/email/templates/layout';

const NAV = [
  { href: '#produto', label: 'Produto' },
  { href: '#como-funciona', label: 'Como funciona' },
  { href: '#planos', label: 'Planos' },
  { href: '#faq', label: 'FAQ' },
];

const FEATURES = [
  { icon: CalendarCheck, label: 'Escalas inteligentes', desc: 'Escala a equipe respeitando as indisponibilidades de cada pessoa, com aviso automático de conflitos.' },
  { icon: ListChecks, label: 'Eventos com roteiro', desc: 'Ministérios, setlist e a ordem do culto, tudo em um só lugar.' },
  { icon: Music2, label: 'Repertório compartilhado', desc: 'Tom, BPM, letras e cifras — com catálogo global entre igrejas e importação por CSV.' },
  { icon: CalendarSync, label: 'Sincronização de calendário', desc: 'Assine suas escalas no Google ou Apple Calendar. Mudou a escala? Seu calendário acompanha.' },
  { icon: Bell, label: 'Avisos por 3 canais', desc: 'Notificação no app, WhatsApp e email — a equipe escolhe quem avisar.' },
  { icon: Users, label: 'Multiministério', desc: 'Ministérios e funções do seu jeito, com histórico de participação de cada voluntário.' },
  { icon: Layers, label: 'Instala sem loja', desc: 'É um PWA — instala na tela inicial direto pelo navegador, sem passar pela App Store ou Google Play.' },
  { icon: Sparkles, label: 'Relatórios de engajamento', desc: 'Frequência de participação e distribuição por ministério, por período.' },
];

/**
 * Rótulos em pt-BR para as chaves de `plans.features` (ver migração 028 /
 * src/lib/plan-features.ts — esse arquivo é pt-PT, usado dentro do app
 * autenticado; aqui é só a landing pública, em pt-BR).
 */
const FEATURE_LABELS: Record<string, string> = {
  member_history: 'Histórico de participação',
  notifications: 'Notificações no app',
  recurring_unavailability: 'Disponibilidade recorrente',
  calendar_sync: 'Sincronização de calendário',
  event_timeline: 'Roteiro do evento',
  song_ranking: 'Ranking de músicas',
  pdf_export: 'Exportação em PDF',
  email_notifications: 'Avisos por email',
  engagement_reports: 'Relatórios de engajamento',
  priority_support: 'Suporte prioritário',
};

const METRICS = [
  { icon: LayoutGrid, value: '7', label: 'módulos integrados' },
  { icon: Layers, value: 'PWA', label: 'instala sem loja' },
  { icon: Building2, value: '1 conta', label: 'várias organizações' },
  { icon: Globe, value: '€ / R$', label: 'Portugal e Brasil' },
];

const STEPS = [
  { n: '1', title: 'Crie a organização', desc: 'Em menos de um minuto, sem cartão de crédito.' },
  { n: '2', title: 'Defina os ministérios', desc: 'Louvor, mídia, sonoplastia — com as funções que fizerem sentido pra sua igreja.' },
  { n: '3', title: 'Convide a equipe', desc: 'Por código de convite ou email — cada pessoa entra com a própria conta.' },
  { n: '4', title: 'Publique o culto', desc: 'Monte a escala, publique, e avise por app, WhatsApp ou email.' },
];

const FAQ: { q: string; a: string }[] = [
  { q: 'Preciso instalar alguma coisa?', a: 'Não. O WIS é um PWA — abre no navegador e você pode "instalá-lo" na tela inicial do celular direto por lá, sem passar pela App Store ou Google Play.' },
  { q: 'Posso importar meu repertório atual?', a: 'Sim — o Repertório tem um importador de CSV com mapeamento de colunas, pra você trazer suas músicas de uma vez.' },
  { q: 'Como funcionam os planos?', a: 'Cada plano define quantas pessoas, ministérios e administradores cabem na sua organização, e quais funcionalidades extras estão incluídas. Você pode começar grátis e mudar de plano depois.' },
  { q: 'Como funciona a sincronização de calendário?', a: 'Você assina um link único no Google Calendar ou no Calendário da Apple. Ele mostra só os eventos em que você está escalado e se atualiza sozinho — mudou a escala, seu calendário acompanha, sem precisar salvar de novo.' },
  { q: 'Dá pra usar em mais de um ministério ao mesmo tempo?', a: 'Sim. Você pode servir em vários ministérios (ex.: Louvor e Multimídia) com funções diferentes em cada um, e vê as escalas de todos no mesmo lugar.' },
];

function fmtPrice(v: number): string {
  return v === 0 ? 'Grátis' : `${v.toFixed(2).replace('.', ',')} €`;
}

type Platform = 'ios' | 'android' | 'desktop';

function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'desktop';
}

interface Props { plans: PlanDef[] }

export function PlanosClient({ plans }: Props) {
  const [annual, setAnnual] = useState(false);
  const [platform, setPlatform] = useState<Platform>('desktop');

  useEffect(() => { setPlatform(detectPlatform()); }, []);

  return (
    <div style={{ minHeight: '100dvh', background: '#08090b', color: '#f4f5f7' }}>
      <BackgroundGlow />

      {/* ── Header ─────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 40,
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        background: 'rgba(8,9,11,0.72)', borderBottom: '1px solid rgba(255,255,255,0.10)',
      }}>
        <div style={{
          maxWidth: '72rem', margin: '0 auto', padding: '0.875rem 1.25rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
        }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.55rem', fontSize: '1rem', fontWeight: 800, letterSpacing: '-0.01em', color: '#fff', textDecoration: 'none', flexShrink: 0 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '1.7rem', height: '1.7rem', borderRadius: '0.5rem',
              background: 'linear-gradient(135deg, #2c7fa8 0%, #14536f 100%)',
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/wis-symbol-white.svg" alt="" style={{ width: '1.05rem', height: '1.05rem' }} />
            </span>
            WIS <span style={{ color: '#8fd0ea' }}>· Services</span>
          </Link>

          <nav className="hidden md:flex" style={{ gap: '1.5rem' }}>
            {NAV.map((n) => (
              <a key={n.href} href={n.href} style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>
                {n.label}
              </a>
            ))}
          </nav>

          <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
            <a href={APP_URL} target="_blank" rel="noopener noreferrer" style={ghostBtn}>
              Entrar
            </a>
            <a href="#planos" style={primaryBtn}>
              Começar grátis
            </a>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────── */}
      <section style={{ maxWidth: '72rem', margin: '0 auto', padding: '4.5rem 1.25rem 2rem', textAlign: 'center' }}>
        <h1 style={{
          fontSize: 'clamp(2.1rem, 5.2vw, 3.4rem)', fontWeight: 700, letterSpacing: '-0.03em',
          lineHeight: 1.07, margin: '0 auto 1rem', maxWidth: '38rem',
        }}>
          Escalas, cultos e repertório <span style={{ color: 'rgba(255,255,255,0.4)' }}>em sincronia.</span>
        </h1>
        <p style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.55)', maxWidth: '32rem', margin: '0 auto 2rem', lineHeight: 1.6 }}>
          Chega de grupo de WhatsApp e planilha solta. O WIS organiza sua equipe de
          louvor — escalas, repertório e avisos — em um só lugar.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          <a href="#planos" style={{ ...primaryBtn, padding: '0.75rem 1.5rem', fontSize: '0.95rem' }}>
            Começar grátis
          </a>
          <a href={APP_URL} target="_blank" rel="noopener noreferrer" style={{ ...ghostBtn, padding: '0.75rem 1.5rem', fontSize: '0.95rem' }}>
            Ver o app <ExternalLink style={{ width: '0.8rem', height: '0.8rem' }} />
          </a>
        </div>
        <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)' }}>
          Plano Semente grátis · sem cartão
        </p>
      </section>

      {/* ── Composição de produto ──────────────────────── */}
      <section id="produto" style={{ maxWidth: '64rem', margin: '0 auto', padding: '1rem 1.25rem 3rem' }}>
        <ProductComposition />
      </section>

      {/* ── Faixa de métricas ──────────────────────────── */}
      <section style={{ borderTop: '1px solid rgba(255,255,255,0.10)', borderBottom: '1px solid rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.015)' }}>
        <div style={{
          maxWidth: '72rem', margin: '0 auto', padding: '2rem 1.25rem',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(12rem, 1fr))', gap: '1rem',
        }}>
          {METRICS.map((m) => (
            <div key={m.label} style={{
              display: 'flex', alignItems: 'center', gap: '0.85rem',
              padding: '1rem 1.1rem', borderRadius: '0.875rem',
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <div style={{
                flexShrink: 0, width: '2.5rem', height: '2.5rem', borderRadius: '0.7rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(143,208,234,0.1)', border: '1px solid rgba(143,208,234,0.25)',
              }}>
                <m.icon style={{ width: '1.15rem', height: '1.15rem', color: '#8fd0ea' }} />
              </div>
              <div>
                <p style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#fff' }}>{m.value}</p>
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', margin: 0 }}>{m.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Blocos de produto alternados ───────────────── */}
      <section style={{ maxWidth: '72rem', margin: '0 auto', padding: '4rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '5rem' }}>
        <ProductBlock
          n="01" title="Eventos" reverse={false}
          desc="Monte o culto do começo ao fim: quem está escalado em cada ministério, a setlist na ordem certa e o roteiro minuto a minuto — tudo pronto pra publicar e avisar a equipe."
          chips={[
            { icon: ListChecks, label: 'Rascunho → publicação' },
            { icon: Music2, label: 'Setlist do culto' },
            { icon: UserCheck, label: 'Confirmação de presença' },
          ]}
          macSrc="/screenshots/web-escala-publicar.webp" macAlt="Escala do Culto de Domingo, publicada, com opção de notificar por WhatsApp"
          phoneSrc="/screenshots/mobile-setlist.webp" phoneAlt="Setlist do Culto de Domingo no celular, com tom e BPM de cada música"
        />
        <ProductBlock
          n="02" title="Repertório" reverse
          desc="Tom, BPM, letra, cifra e links — com importador de CSV pra trazer seu catálogo de uma vez, e ranking das músicas mais tocadas."
          chips={[
            { icon: Music2, label: 'Tom e BPM' },
            { icon: ListMusic, label: 'Ranking de músicas' },
            { icon: Sparkles, label: 'Importação de CSV' },
          ]}
          macSrc="/screenshots/web-repertorio-ranking.webp" macAlt="Repertório em modo Ranking, com as músicas mais tocadas e a data da última vez"
          phoneSrc="/screenshots/mobile-repertorio.webp" phoneAlt="Lista de repertório no celular, com o tom de cada música"
        />
        <ProductBlock
          n="03" title="Escalas e pessoas" reverse={false}
          desc="Funções por ministério, indisponibilidades visíveis pra quem escala, e cada pessoa escolhe onde serve e quais são suas funções."
          chips={[
            { icon: Clock, label: 'Indisponibilidades da equipe' },
            { icon: Users, label: 'Ministérios e funções' },
            { icon: Bell, label: 'Papéis da equipe' },
          ]}
          macSrc="/screenshots/web-indisponibilidade.webp" macAlt="Indisponibilidade da equipe, com motivo e período visível pra quem escala"
          phoneSrc="/screenshots/mobile-funcoes.webp" phoneAlt="Escolha de ministérios e funções de cada pessoa, no celular"
        />
      </section>

      {/* ── Funcionalidades ────────────────────────────── */}
      <section style={{ maxWidth: '72rem', margin: '0 auto', padding: '1rem 1.25rem 4rem' }}>
        <SectionTitle kicker="Funcionalidades" title="Tudo o que sua equipe precisa" />
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(15.5rem, 1fr))', gap: '1rem', marginTop: '2rem',
        }}>
          {FEATURES.map((f) => (
            <div key={f.label} style={card}>
              <div style={{
                width: '2.5rem', height: '2.5rem', borderRadius: '0.7rem', marginBottom: '0.875rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(143,208,234,0.1)', border: '1px solid rgba(143,208,234,0.25)',
              }}>
                <f.icon style={{ width: '1.1rem', height: '1.1rem', color: '#8fd0ea' }} />
              </div>
              <p style={{ fontSize: '0.92rem', fontWeight: 700, margin: '0 0 0.35rem' }}>{f.label}</p>
              <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Como funciona ──────────────────────────────── */}
      <section id="como-funciona" style={{ maxWidth: '72rem', margin: '0 auto', padding: '1rem 1.25rem 4rem' }}>
        <SectionTitle kicker="Como funciona" title="Sua equipe organizada em 4 passos" />

        <div style={{ marginTop: '2rem' }}>
          <WizardMock />
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(13rem, 1fr))', gap: '1.25rem', marginTop: '2rem',
        }}>
          {STEPS.map((s) => (
            <div key={s.n} style={{ ...card, textAlign: 'center' }}>
              <div style={{
                width: '2.25rem', height: '2.25rem', borderRadius: '9999px', margin: '0 auto 0.875rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#fff', color: '#000', fontWeight: 800, fontSize: '0.9rem',
              }}>
                {s.n}
              </div>
              <p style={{ fontSize: '0.92rem', fontWeight: 700, margin: '0 0 0.35rem' }}>{s.title}</p>
              <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Planos ─────────────────────────────────────── */}
      <section id="planos" style={{ maxWidth: '72rem', margin: '0 auto', padding: '1rem 1.25rem 4rem' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem',
        }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3.2vw, 2.1rem)', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
            Cresça no ritmo da sua equipe
          </h2>
          <div style={{
            display: 'inline-flex', padding: '0.2rem', borderRadius: '0.625rem',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
          }}>
            {[{ v: false, l: 'Mensal' }, { v: true, l: 'Anual' }].map(({ v, l }) => (
              <button
                key={l}
                onClick={() => setAnnual(v)}
                style={{
                  padding: '0.4rem 0.95rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer',
                  fontSize: '0.8rem', fontWeight: 600,
                  background: annual === v ? '#fff' : 'transparent',
                  color: annual === v ? '#000' : 'rgba(255,255,255,0.55)',
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(15.5rem, 1fr))', gap: '1rem',
        }}>
          {plans.map((plan, i) => (
            <PlanCard key={plan.key} plan={plan} annual={annual} previousFeatures={i > 0 ? plans[i - 1].features : []} />
          ))}
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', marginTop: '1.5rem' }}>
          Sem cartão pra começar no Semente. Os planos pagos são cobrados de forma segura via Stripe.
        </p>
      </section>

      {/* ── App / Entrar na App ────────────────────────── */}
      <section id="app" style={{ maxWidth: '72rem', margin: '0 auto', padding: '1rem 1.25rem 4rem' }}>
        <div style={{
          borderRadius: '1.25rem', border: '1px solid rgba(255,255,255,0.10)',
          background: 'rgba(255,255,255,0.02)', overflow: 'hidden', position: 'relative',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(18rem, 1fr))', alignItems: 'center',
        }}>
          <div aria-hidden style={{
            position: 'absolute', top: -80, left: -80, width: 320, height: 320, borderRadius: '9999px', pointerEvents: 'none',
            background: 'radial-gradient(circle, rgba(44,127,168,0.2) 0%, transparent 70%)',
          }} />
          <div style={{ padding: '2.5rem 2rem', position: 'relative' }}>
            <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 1rem' }}>
              No bolso de quem serve
            </h2>
            <p style={{ fontSize: '0.92rem', color: 'rgba(255,255,255,0.55)', maxWidth: '26rem', marginBottom: '1.75rem', lineHeight: 1.65 }}>
              {platform === 'ios' && 'No iPhone, abra no Safari e toque em "Adicionar à Tela de Início" — fica igual a um app nativo.'}
              {platform === 'android' && 'No Android, abra no Chrome e toque em "Instalar aplicativo" — fica na sua tela inicial em segundos.'}
              {platform === 'desktop' && 'Baixe pra iOS ou Android — ou use já pelo navegador.'}
              {' '}O WIS instala na tela inicial sem passar por loja nenhuma e continua abrindo mesmo com rede fraca.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
              <span style={{ ...storeBadge, opacity: platform === 'ios' ? 1 : 0.6 }}>App Store <em style={soonTag}>Em breve</em></span>
              <span style={{ ...storeBadge, opacity: platform === 'android' ? 1 : 0.6 }}>Google Play <em style={soonTag}>Em breve</em></span>
              <a href={APP_URL} target="_blank" rel="noopener noreferrer" style={primaryBtn}>
                Entrar na App <ExternalLink style={{ width: '0.8rem', height: '0.8rem' }} />
              </a>
            </div>
          </div>

          <div style={{
            position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
            gap: '1rem', padding: '2.5rem 2rem 0', minHeight: '20rem',
          }}>
            <div style={{ width: '10rem', marginBottom: '-1.5rem' }}>
              <IPhoneFrame src="/screenshots/mobile-eventos-equipa.webp" alt="Ministérios & Equipa de um evento, no celular" />
            </div>
            <div style={{ width: '9rem' }} className="hidden sm:block">
              <IPhoneFrame src="/screenshots/mobile-repertorio.webp" alt="Repertório da organização, no celular" />
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────── */}
      <section id="faq" style={{ maxWidth: '72rem', margin: '0 auto', padding: '1rem 1.25rem 4rem' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(15rem, 1fr))', gap: '2.5rem',
        }}>
          <div>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#8fd0ea', margin: '0 0 0.75rem' }}>
              FAQ
            </p>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3.6vw, 2.4rem)', fontWeight: 800, letterSpacing: '-0.02em', margin: 0, lineHeight: 1.1 }}>
              Perguntas frequentes
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', borderBottom: '1px solid rgba(255,255,255,0.10)' }}>
            {FAQ.map((item) => <FaqItem key={item.q} {...item} />)}
          </div>
        </div>
      </section>

      {/* ── CTA final ──────────────────────────────────── */}
      <section style={{ maxWidth: '72rem', margin: '0 auto', padding: '5rem 1.25rem 6rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(1.7rem, 4vw, 2.5rem)', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 1.75rem', lineHeight: 1.2 }}>
          Domingo já vem aí. <span style={{ color: 'rgba(255,255,255,0.4)' }}>Organize sua equipe hoje.</span>
        </h2>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="#planos" style={{ ...primaryBtn, padding: '0.75rem 1.5rem', fontSize: '0.9rem' }}>Começar grátis</a>
          <a href={APP_URL} target="_blank" rel="noopener noreferrer" style={{ ...ghostBtn, padding: '0.75rem 1.5rem', fontSize: '0.9rem' }}>Entrar na App</a>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.10)', padding: '2.5rem 1.25rem' }}>
        <div style={{
          maxWidth: '72rem', margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(11rem, 1fr))', gap: '2rem',
        }}>
          <div>
            <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>WIS <span style={{ color: '#8fd0ea' }}>· Services</span></span>
            <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.6rem', lineHeight: 1.6 }}>
              Gestão de ministérios de igreja — escalas, eventos e repertório.
            </p>
          </div>
          <FooterCol title="Produto" links={[{ href: '#produto', label: 'Funcionalidades' }, { href: '#planos', label: 'Planos' }, { href: APP_URL, label: 'Entrar na App' }]} />
          <FooterCol title="Legal" links={[{ href: '/termos', label: 'Termos de Uso' }, { href: '/privacidade', label: 'Privacidade' }]} />
          <FooterCol title="Suporte" links={[{ href: '/suporte', label: 'Central de ajuda' }, { href: `mailto:${SUPPORT_EMAIL}`, label: SUPPORT_EMAIL }]} />
        </div>
        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: '2.5rem' }}>
          © {new Date().getUTCFullYear()} WIS - Services
        </p>
      </footer>
    </div>
  );
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: '0.75rem' }}>
        {title}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {links.map((l) => (
          <Link key={l.label} href={l.href} style={footerLink}>{l.label}</Link>
        ))}
      </div>
    </div>
  );
}

function PlanCard({ plan, annual, previousFeatures }: { plan: PlanDef; annual: boolean; previousFeatures: string[] }) {
  const price = annual ? plan.priceAnnual : plan.priceMonthly;
  const savings = annualSavingsPercent(plan);
  const popular = plan.key === 'colheita';

  // Só mostra o que o plano acrescenta ao anterior — os planos são
  // cumulativos, então repetir tudo de novo em cada cartão é ruído.
  const newFeatures = plan.features.filter((f) => !previousFeatures.includes(f));

  const limitsLine = [
    plan.maxPeople === null ? 'Pessoas ilimitadas' : `${plan.maxPeople} pessoas`,
    plan.maxMinistries === null ? 'ministérios ilimitados' : `${plan.maxMinistries} ministério${plan.maxMinistries === 1 ? '' : 's'}`,
    plan.maxAdmins === null ? 'admins ilimitados' : `${plan.maxAdmins} admin${plan.maxAdmins === 1 ? '' : 's'}`,
  ].join(' · ');

  return (
    <div style={{
      position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column',
      borderRadius: '1rem', padding: '1.35rem 1.5rem',
      border: popular ? '1px solid rgba(143,208,234,0.45)' : '1px solid rgba(255,255,255,0.10)',
      background: popular ? 'linear-gradient(180deg, rgba(143,208,234,0.08) 0%, rgba(255,255,255,0.02) 100%)' : 'rgba(255,255,255,0.025)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
          {plan.label}
        </p>
        {popular && (
          <span style={{
            fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
            padding: '0.15rem 0.5rem', borderRadius: '9999px', background: '#8fd0ea', color: '#000',
          }}>
            Popular
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
        <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>
          {fmtPrice(price)}
        </span>
        {price > 0 && <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>/{annual ? 'ano' : 'mês'}</span>}
      </div>

      <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)', margin: '0.3rem 0 0' }}>{limitsLine}</p>
      {annual && savings > 0 ? (
        <p style={{ fontSize: '0.72rem', color: '#8fd0ea', margin: '0.3rem 0 0', fontWeight: 700 }}>Economize {savings}%</p>
      ) : null}

      <ul style={{ listStyle: 'none', padding: 0, margin: '1.1rem 0 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.55rem', flex: 1 }}>
        {plan.features.length === 0 ? (
          <>
            <li style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)' }}>Escala simples</li>
            <li style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)' }}>Acesso do voluntário ao app</li>
          </>
        ) : newFeatures.map((f) => (
          <li key={f} style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
            {FEATURE_LABELS[f] ?? f}
          </li>
        ))}
      </ul>

      <Link
        href="/register"
        style={{
          display: 'block', textAlign: 'center', padding: '0.65rem 1rem', borderRadius: '0.5rem',
          textDecoration: 'none', fontSize: '0.85rem', fontWeight: 700,
          background: popular ? '#fff' : 'rgba(255,255,255,0.08)',
          color: popular ? '#000' : '#fff',
          border: popular ? 'none' : '1px solid rgba(255,255,255,0.14)',
        }}
      >
        {plan.priceMonthly === 0 ? 'Começar' : 'Assinar'}
      </Link>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.10)' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '1rem', padding: '1.15rem 0', background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'left', color: '#fff', fontSize: '0.95rem', fontWeight: 600,
        }}
      >
        {q}
        <Plus style={{
          width: '1.1rem', height: '1.1rem', flexShrink: 0, color: '#8fd0ea',
          transform: open ? 'rotate(45deg)' : 'none', transition: 'transform 0.15s',
        }} />
      </button>
      {open && (
        <p style={{ padding: '0 0 1.15rem', margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.65, maxWidth: '38rem' }}>
          {a}
        </p>
      )}
    </div>
  );
}

function SectionTitle({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', margin: '0 0 0.5rem' }}>
        {kicker}
      </p>
      <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 1.9rem)', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
        {title}
      </h2>
    </div>
  );
}

function BackgroundGlow() {
  return (
    <div aria-hidden style={{
      position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
      backgroundImage:
        'radial-gradient(ellipse 60% 45% at 50% -8%, rgba(44,127,168,0.18) 0%, transparent 65%),' +
        'radial-gradient(ellipse 40% 35% at 85% 15%, rgba(20,83,111,0.12) 0%, transparent 55%)',
    }} />
  );
}

/**
 * Composição visual do produto: um MacBook com a captura real do painel web
 * e um iPhone sobreposto com uma captura real do mobile, mais chips
 * flutuantes em vidro fosco.
 */
function ProductComposition() {
  return (
    <div style={{ position: 'relative', padding: '1rem 0 4.5rem' }}>
      <MacFrame src="/screenshots/web-inicio.webp" alt="Painel Início do WIS, com os próximos eventos da organização" />

      <div style={{
        position: 'absolute', bottom: '-2.5rem', right: '2%', width: '9rem',
      }} className="hidden sm:block">
        <IPhoneFrame src="/screenshots/mobile-eventos-equipa.webp" alt="Confirmações de presença da equipe de Louvor, no celular" />
      </div>

      <FloatingChip icon={UserCheck} label="Presença confirmada" top="2%" left="-4%" delay="0s" size="md" />
      <FloatingChip icon={Bell} label="Escala publicada" top="38%" left="-9%" delay="0.9s" size="lg" />
      <FloatingChip icon={Clock} label="Gestão de indisponibilidade" top="80%" left="2%" delay="1.7s" size="md" />
      <FloatingChip icon={Bell} label="3 canais de aviso" top="16%" right="-6%" delay="0.4s" size="sm" />
      <FloatingChip icon={Sparkles} label="CSV importado" top="62%" right="8%" delay="1.3s" size="sm" />
    </div>
  );
}

/** Moldura de MacBook (bisel + base) em torno de uma captura real do painel web. */
function MacFrame({ src, alt }: { src: string; alt: string }) {
  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      <div style={{
        borderRadius: '0.7rem 0.7rem 0 0', border: '1px solid rgba(255,255,255,0.14)',
        borderBottom: 'none', background: '#0d0e11', padding: '0.55rem 0.55rem 0',
        boxShadow: '0 30px 80px -20px rgba(0,0,0,0.65)',
      }}>
        <div style={{
          position: 'absolute', top: '0.75rem', left: '50%', transform: 'translateX(-50%)',
          width: 5, height: 5, borderRadius: '9999px', background: 'rgba(255,255,255,0.15)',
        }} />
        <div style={{ borderRadius: '0.4rem', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} loading="lazy" style={{ display: 'block', width: '100%', height: 'auto' }} />
        </div>
      </div>
      {/* Base/dobradiça */}
      <div style={{
        height: '0.7rem', background: 'linear-gradient(180deg, #2a2b30 0%, #1a1b1f 100%)',
        borderRadius: '0 0 0.3rem 0.3rem', position: 'relative',
      }}>
        <div style={{
          position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: '18%', height: '0.35rem', background: '#0d0e11', borderRadius: '0 0 0.5rem 0.5rem',
        }} />
      </div>
    </div>
  );
}

/** Moldura de iPhone (dynamic island + home indicator) em torno de uma captura real do mobile. */
function IPhoneFrame({ src, alt }: { src: string; alt: string }) {
  return (
    <div style={{
      position: 'relative', borderRadius: '1.6rem', border: '3px solid #1f2024',
      background: '#0d0e11', boxShadow: '0 25px 60px -18px rgba(0,0,0,0.7)', overflow: 'hidden',
      zIndex: 1,
    }}>
      <div style={{
        position: 'absolute', top: '0.4rem', left: '50%', transform: 'translateX(-50%)',
        width: '32%', height: '0.85rem', borderRadius: '9999px', background: '#000', zIndex: 2,
      }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} loading="lazy" style={{ display: 'block', width: '100%', height: 'auto' }} />
      <div style={{
        position: 'absolute', bottom: '0.45rem', left: '50%', transform: 'translateX(-50%)',
        width: '34%', height: '0.2rem', borderRadius: '9999px', background: 'rgba(255,255,255,0.55)',
      }} />
    </div>
  );
}

const CHIP_SIZES = {
  sm: { padding: '0.35rem 0.7rem', fontSize: '0.66rem', iconBox: '1.1rem', iconSize: '0.62rem' },
  md: { padding: '0.45rem 0.85rem', fontSize: '0.75rem', iconBox: '1.3rem', iconSize: '0.7rem' },
  lg: { padding: '0.55rem 1rem', fontSize: '0.85rem', iconBox: '1.5rem', iconSize: '0.8rem' },
};

function FloatingChip({ icon: Icon, label, top, left, right, delay, size = 'md' }: {
  icon: typeof Music2; label: string; top: string; left?: string; right?: string; delay: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const s = CHIP_SIZES[size];
  return (
    <div
      className="hidden md:flex"
      style={{
        position: 'absolute', top, left, right, zIndex: 3,
        alignItems: 'center', gap: '0.45rem', padding: s.padding, borderRadius: '9999px',
        background: 'rgba(20,22,26,0.9)', border: '1px solid rgba(255,255,255,0.14)',
        backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', fontSize: s.fontSize, fontWeight: 600, color: '#fff',
        boxShadow: '0 8px 24px -8px rgba(0,0,0,0.55)', whiteSpace: 'nowrap',
        animation: `wis-float 4s ease-in-out ${delay} infinite`,
      }}
    >
      <span style={{
        flexShrink: 0, width: s.iconBox, height: s.iconBox, borderRadius: '9999px',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(143,208,234,0.18)',
      }}>
        <Icon style={{ width: s.iconSize, height: s.iconSize, color: '#8fd0ea' }} />
      </span>
      {label}
      <style>{`@keyframes wis-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }`}</style>
    </div>
  );
}

function ProductBlock({ n, title, desc, chips, reverse, macSrc, macAlt, phoneSrc, phoneAlt }: {
  n: string; title: string; desc: string;
  chips: { icon: typeof Music2; label: string }[]; reverse: boolean;
  macSrc: string; macAlt: string; phoneSrc: string; phoneAlt: string;
}) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(18rem, 1fr))', gap: '2rem', alignItems: 'center',
      direction: reverse ? 'rtl' : 'ltr',
    }}>
      <div style={{ direction: 'ltr' }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em' }}>{n}</span>
        <h3 style={{ fontSize: 'clamp(1.3rem, 2.4vw, 1.7rem)', fontWeight: 800, letterSpacing: '-0.02em', margin: '0.4rem 0 0.75rem' }}>{title}</h3>
        <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, marginBottom: '1.25rem', maxWidth: '26rem' }}>{desc}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {chips.map((c) => (
            <div key={c.label} style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem', alignSelf: 'flex-start',
              padding: '0.4rem 0.8rem', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 600,
              background: 'rgba(143,208,234,0.08)', border: '1px solid rgba(143,208,234,0.2)', color: '#c9ecf7',
            }}>
              <c.icon style={{ width: '0.85rem', height: '0.85rem' }} />
              {c.label}
            </div>
          ))}
        </div>
      </div>
      <div style={{ direction: 'ltr', position: 'relative', minHeight: '18rem' }}>
        <div style={{ maxWidth: '24rem', margin: '0 auto' }}>
          <MacFrame src={macSrc} alt={macAlt} />
        </div>
        <div style={{ position: 'absolute', bottom: '-1.5rem', right: '4%', width: '7rem' }} className="hidden sm:block">
          <IPhoneFrame src={phoneSrc} alt={phoneAlt} />
        </div>
      </div>
    </div>
  );
}

function WizardMock() {
  const steps = ['Informações', 'Ministérios', 'Integrantes', 'Setlist', 'Roteiro'];
  return (
    <div style={{ ...card, padding: '1.5rem' }}>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {steps.map((s, i) => (
          <span key={s} style={{
            fontSize: '0.72rem', fontWeight: 600, padding: '0.3rem 0.75rem', borderRadius: '9999px',
            background: i === 4 ? '#8fd0ea' : 'rgba(255,255,255,0.05)',
            color: i === 4 ? '#000' : 'rgba(255,255,255,0.45)',
            border: i === 4 ? 'none' : '1px solid rgba(255,255,255,0.1)',
          }}>
            {i + 1}. {s}
          </span>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(9rem, 1fr))', gap: '0.75rem' }}>
        {['Louvor', 'Mídia', 'Sonoplastia'].map((m) => (
          <div key={m} style={{
            padding: '0.9rem', borderRadius: '0.6rem', background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 700, margin: '0 0 0.3rem' }}>{m}</p>
            <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Escolha a equipe</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const card: React.CSSProperties = {
  position: 'relative', zIndex: 1,
  background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: '1rem', padding: '1.5rem',
};

const primaryBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
  padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.82rem', fontWeight: 700,
  background: '#fff', color: '#000', textDecoration: 'none', whiteSpace: 'nowrap',
};

const ghostBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
  padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.82rem', fontWeight: 600,
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
  color: 'rgba(255,255,255,0.8)', textDecoration: 'none', whiteSpace: 'nowrap',
};

const storeBadge: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
  padding: '0.6rem 1.1rem', borderRadius: '0.6rem', fontSize: '0.82rem', fontWeight: 600,
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)',
};

const soonTag: React.CSSProperties = {
  fontStyle: 'normal', fontSize: '0.65rem', fontWeight: 700, padding: '0.1rem 0.4rem',
  borderRadius: '9999px', background: 'rgba(252,211,77,0.15)', color: '#fcd34d',
};

const footerLink: React.CSSProperties = {
  fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', textDecoration: 'none',
};
