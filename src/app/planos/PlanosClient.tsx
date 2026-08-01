'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CalendarCheck, Music2, Users, Bell, Smartphone,
  CalendarSync, ListChecks, Plus, ExternalLink, Check, Sparkles,
  ListMusic, UserCheck, Clock, Layers,
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
  { icon: CalendarCheck, label: 'Escalas inteligentes', desc: 'Escala a equipa respeitando as indisponibilidades de cada pessoa, com aviso automático de conflitos.' },
  { icon: ListChecks, label: 'Eventos com roteiro', desc: 'Ministérios, setlist e a ordem do culto, tudo num só sítio.' },
  { icon: Music2, label: 'Repertório partilhado', desc: 'Tom, BPM, letras e cifras — com catálogo global entre igrejas e importação por CSV.' },
  { icon: CalendarSync, label: 'Sincronização de calendário', desc: 'Subscreve as tuas escalas no Google ou Apple Calendar. Mudou a escala? O teu calendário acompanha.' },
  { icon: Bell, label: 'Avisos por 3 canais', desc: 'Notificação na app, WhatsApp e email — a equipa escolhe a quem avisar.' },
  { icon: Users, label: 'Multi-ministério', desc: 'Ministérios e funções à tua medida, com histórico de participação de cada voluntário.' },
  { icon: Layers, label: 'Instala-se sem loja', desc: 'É uma PWA — instala-se no ecrã inicial diretamente do navegador, sem passar pela App Store ou Google Play.' },
  { icon: Sparkles, label: 'Relatórios de engajamento', desc: 'Frequência de participação e distribuição por ministério, por período.' },
];

const STEPS = [
  { n: '1', title: 'Cria a organização', desc: 'Em menos de um minuto, sem cartão de crédito.' },
  { n: '2', title: 'Define os ministérios', desc: 'Louvor, multimédia, sonoplastia — com as funções que fizerem sentido para a tua igreja.' },
  { n: '3', title: 'Convida a equipa', desc: 'Por código de convite ou email — cada pessoa entra com a sua conta.' },
  { n: '4', title: 'Publica o culto', desc: 'Monta a escala, publica, e avisa por app, WhatsApp ou email.' },
];

const FAQ: { q: string; a: string }[] = [
  { q: 'Preciso de instalar alguma coisa?', a: 'Não. O WIS é uma PWA — abre no navegador e podes "instalá-la" no ecrã inicial do telemóvel diretamente a partir daí, sem passar pela App Store ou Google Play.' },
  { q: 'Posso importar o meu repertório atual?', a: 'Sim — o Repertório tem um importador de CSV com mapeamento de colunas, para trazeres as tuas músicas de uma vez.' },
  { q: 'Como funcionam os planos?', a: 'Cada plano define quantas pessoas, ministérios e administradores cabem na tua organização, e que funcionalidades extra estão incluídas. Podes começar grátis e mudar de plano depois.' },
  { q: 'Uma igreja com vários campus, como faz?', a: 'Por agora, cria uma organização (e uma assinatura) por campus. É a forma mais simples de manter os dados de cada campus separados.' },
  { q: 'Os meus dados estão seguros?', a: 'Sim. Cada organização só vê os seus próprios dados — o isolamento é garantido ao nível da base de dados (Row Level Security) e por papéis (admin, líder, membro), não apenas na aplicação.' },
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
          <Link href="/" style={{ fontSize: '1rem', fontWeight: 800, letterSpacing: '-0.01em', color: '#fff', textDecoration: 'none', flexShrink: 0 }}>
            WIS <span style={{ color: '#8fd0ea' }}>· Worship in Sync</span>
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
        <span style={badgeStyle}>
          <Layers style={{ width: '0.7rem', height: '0.7rem' }} />
          App para iOS, Android e navegador · instala-se sem loja
        </span>
        <h1 style={{
          fontSize: 'clamp(2.1rem, 5.2vw, 3.4rem)', fontWeight: 700, letterSpacing: '-0.03em',
          lineHeight: 1.07, margin: '1.25rem auto 1rem', maxWidth: '38rem',
        }}>
          Escalas, cultos e repertório <span style={{ color: 'rgba(255,255,255,0.4)' }}>em sincronia.</span>
        </h1>
        <p style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.55)', maxWidth: '32rem', margin: '0 auto 2rem', lineHeight: 1.6 }}>
          Chega de grupos de WhatsApp e folhas soltas. O WIS organiza a tua equipa de
          louvor — escalas, repertório e avisos — num só sítio.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          <a href="#planos" style={{ ...primaryBtn, padding: '0.75rem 1.5rem', fontSize: '0.95rem' }}>
            Começar grátis
          </a>
          <a href={APP_URL} target="_blank" rel="noopener noreferrer" style={{ ...ghostBtn, padding: '0.75rem 1.5rem', fontSize: '0.95rem' }}>
            Ver a app <ExternalLink style={{ width: '0.8rem', height: '0.8rem' }} />
          </a>
        </div>
        <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)' }}>
          Plano Semente grátis para sempre · sem cartão
        </p>
      </section>

      {/* ── Composição de produto ──────────────────────── */}
      <section id="produto" style={{ maxWidth: '64rem', margin: '0 auto', padding: '1rem 1.25rem 3rem' }}>
        <ProductComposition />
      </section>

      {/* ── Faixa de métricas ──────────────────────────── */}
      <section style={{ borderTop: '1px solid rgba(255,255,255,0.10)', borderBottom: '1px solid rgba(255,255,255,0.10)' }}>
        <div style={{
          maxWidth: '72rem', margin: '0 auto', padding: '1.5rem 1.25rem',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(9rem, 1fr))', gap: '1rem', textAlign: 'center',
        }}>
          {[
            { v: '7', l: 'módulos' }, { v: 'PWA', l: 'sem loja para instalar' },
            { v: '1 conta', l: 'várias organizações' }, { v: '€ / R$', l: 'Portugal e Brasil' },
          ].map((m) => (
            <div key={m.l}>
              <p style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>{m.v}</p>
              <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>{m.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Blocos de produto alternados ───────────────── */}
      <section style={{ maxWidth: '72rem', margin: '0 auto', padding: '4rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '5rem' }}>
        <ProductBlock
          n="01" title="Eventos" reverse={false}
          desc="Cada culto num só ecrã: quem está escalado em cada ministério, o roteiro do momento e a ordem das músicas do dia."
          chips={[
            { icon: ListChecks, label: 'Rascunho → publicação' },
            { icon: Music2, label: 'Playlist do YouTube' },
            { icon: UserCheck, label: 'Confirmação de presença' },
          ]}
        />
        <ProductBlock
          n="02" title="Repertório" reverse
          desc="Tom, BPM, letra, cifra e links — com capa automática do YouTube e um importador de CSV para trazeres o teu catálogo de uma vez."
          chips={[
            { icon: Music2, label: 'Tom e BPM' },
            { icon: ListMusic, label: 'Catálogo partilhado' },
            { icon: Sparkles, label: 'Importação CSV' },
          ]}
        />
        <ProductBlock
          n="03" title="Escalas e pessoas" reverse={false}
          desc="Funções por ministério, indisponibilidades visíveis para quem escala, papéis (admin, líder, membro) e aviso automático ao publicar."
          chips={[
            { icon: Bell, label: 'Publicar e notificar' },
            { icon: Clock, label: 'Indisponibilidades' },
            { icon: Users, label: 'Papéis da equipa' },
          ]}
        />
      </section>

      {/* ── Funcionalidades ────────────────────────────── */}
      <section style={{ maxWidth: '72rem', margin: '0 auto', padding: '1rem 1.25rem 4rem' }}>
        <SectionTitle kicker="Funcionalidades" title="Tudo o que a tua equipa precisa" />
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
        <SectionTitle kicker="Como funciona" title="A tua equipa organizada em 4 passos" />

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
        <SectionTitle kicker="Planos" title="Escolhe o plano da tua equipa" />

        <div style={{ display: 'flex', justifyContent: 'center', margin: '1.75rem 0' }}>
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
          {plans.map((plan) => (
            <PlanCard key={plan.key} plan={plan} annual={annual} />
          ))}
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', marginTop: '1.5rem' }}>
          Sem cartão para começar no Semente. Os planos pagos são cobrados de forma segura via Stripe.
        </p>
      </section>

      {/* ── App / Entrar na PWA ────────────────────────── */}
      <section id="app" style={{ maxWidth: '72rem', margin: '0 auto', padding: '1rem 1.25rem 4rem' }}>
        <div style={{
          ...card, padding: '2.5rem 1.75rem', textAlign: 'center', overflow: 'hidden', position: 'relative',
        }}>
          <div aria-hidden style={{
            position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)',
            width: 320, height: 320, borderRadius: '9999px', pointerEvents: 'none',
            background: 'radial-gradient(circle, rgba(44,127,168,0.22) 0%, transparent 70%)',
          }} />
          <Smartphone style={{ width: '2rem', height: '2rem', color: '#8fd0ea', margin: '0 auto 1rem', position: 'relative' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 0.5rem', position: 'relative' }}>
            Leva o WIS contigo
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', maxWidth: '28rem', margin: '0 auto 1.75rem', lineHeight: 1.6, position: 'relative' }}>
            {platform === 'ios' && 'No iPhone, abre no Safari e toca em "Adicionar ao ecrã principal" — fica igual a uma app nativa.'}
            {platform === 'android' && 'No Android, abre no Chrome e toca em "Instalar aplicação" — fica no teu ecrã inicial em segundos.'}
            {platform === 'desktop' && 'Usa já no navegador — a PWA instala-se no ecrã inicial do telemóvel sem passar por loja nenhuma.'}
            {' '}A app nativa para iOS e Android está a caminho.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1.25rem', position: 'relative' }}>
            <span style={{ ...storeBadge, opacity: platform === 'ios' ? 1 : 0.6 }}>App Store <em style={soonTag}>Em breve</em></span>
            <span style={{ ...storeBadge, opacity: platform === 'android' ? 1 : 0.6 }}>Google Play <em style={soonTag}>Em breve</em></span>
          </div>

          <a href={APP_URL} target="_blank" rel="noopener noreferrer" style={{ ...primaryBtn, padding: '0.75rem 1.5rem', fontSize: '0.9rem', position: 'relative' }}>
            Entrar na PWA <ExternalLink style={{ width: '0.8rem', height: '0.8rem' }} />
          </a>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────── */}
      <section id="faq" style={{ maxWidth: '42rem', margin: '0 auto', padding: '1rem 1.25rem 4rem' }}>
        <SectionTitle kicker="FAQ" title="Perguntas frequentes" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginTop: '2rem' }}>
          {FAQ.map((item) => <FaqItem key={item.q} {...item} />)}
        </div>
      </section>

      {/* ── CTA final ──────────────────────────────────── */}
      <section style={{ maxWidth: '72rem', margin: '0 auto', padding: '1rem 1.25rem 4rem' }}>
        <div style={{
          ...card, padding: '3rem 1.75rem', textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(44,127,168,0.14), rgba(20,83,111,0.1))',
        }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 0.75rem' }}>
            Domingo já vem aí. <span style={{ color: 'rgba(255,255,255,0.5)' }}>Organiza a equipa hoje.</span>
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', marginBottom: '1.75rem' }}>
            Começa grátis. Sem cartão, sem compromisso.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="#planos" style={{ ...primaryBtn, padding: '0.75rem 1.5rem', fontSize: '0.9rem' }}>Começar grátis</a>
            <a href={APP_URL} target="_blank" rel="noopener noreferrer" style={{ ...ghostBtn, padding: '0.75rem 1.5rem', fontSize: '0.9rem' }}>Entrar na PWA</a>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.10)', padding: '2.5rem 1.25rem' }}>
        <div style={{
          maxWidth: '72rem', margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(11rem, 1fr))', gap: '2rem',
        }}>
          <div>
            <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>WIS <span style={{ color: '#8fd0ea' }}>· Worship in Sync</span></span>
            <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.6rem', lineHeight: 1.6 }}>
              Gestão de ministérios de igreja — escalas, eventos e repertório.
            </p>
          </div>
          <FooterCol title="Produto" links={[{ href: '#produto', label: 'Funcionalidades' }, { href: '#planos', label: 'Planos' }, { href: APP_URL, label: 'Entrar na PWA' }]} />
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

function PlanCard({ plan, annual }: { plan: PlanDef; annual: boolean }) {
  const price = annual ? plan.priceAnnual : plan.priceMonthly;
  const savings = annualSavingsPercent(plan);
  const popular = plan.key === 'colheita';

  return (
    <div style={{
      ...card, position: 'relative',
      border: popular ? '1px solid rgba(143,208,234,0.4)' : card.border,
      background: popular ? 'rgba(143,208,234,0.05)' : card.background,
    }}>
      {popular && (
        <span style={{
          position: 'absolute', top: '-0.7rem', left: '50%', transform: 'translateX(-50%)',
          fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '9999px',
          background: '#8fd0ea', color: '#000', whiteSpace: 'nowrap',
        }}>
          Mais popular
        </span>
      )}

      <p style={{ fontSize: '0.95rem', fontWeight: 800, margin: '0 0 0.5rem' }}>{plan.label}</p>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', marginBottom: '0.25rem' }}>
        <span style={{ fontSize: '1.6rem', fontWeight: 800, color: price === 0 ? '#8fd0ea' : '#fff' }}>
          {fmtPrice(price)}
        </span>
        {price > 0 && <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>/ {annual ? 'ano' : 'mês'}</span>}
      </div>
      {annual && savings > 0 && (
        <p style={{ fontSize: '0.72rem', color: '#8fd0ea', margin: '0 0 1rem', fontWeight: 700 }}>Economiza {savings}%</p>
      )}
      {!(annual && savings > 0) && <div style={{ marginBottom: '1rem' }} />}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1.25rem' }}>
        <Limit label={plan.maxPeople === null ? 'Pessoas ilimitadas' : `${plan.maxPeople} pessoas`} />
        <Limit label={plan.maxMinistries === null ? 'Ministérios ilimitados' : `${plan.maxMinistries} ministério${plan.maxMinistries === 1 ? '' : 's'}`} />
        <Limit label={plan.maxAdmins === null ? 'Admins ilimitados' : `${plan.maxAdmins} admin${plan.maxAdmins === 1 ? '' : 's'}`} />
      </div>

      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {plan.features.length === 0 ? (
          <li style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)' }}>Funcionalidades essenciais</li>
        ) : plan.features.map((f) => (
          <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', fontSize: '0.78rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>
            <Check style={{ width: '0.85rem', height: '0.85rem', color: '#8fd0ea', flexShrink: 0, marginTop: '0.15rem' }} />
            {f}
          </li>
        ))}
      </ul>

      <Link
        href="/register"
        style={{
          display: 'block', textAlign: 'center', padding: '0.6rem 1rem', borderRadius: '0.5rem',
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

function Limit({ label }: { label: string }) {
  return (
    <span style={{
      fontSize: '0.68rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '9999px',
      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.55)',
    }}>
      {label}
    </span>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '1rem', padding: '1rem 1.25rem', background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'left', color: '#fff', fontSize: '0.88rem', fontWeight: 600,
        }}
      >
        {q}
        <Plus style={{
          width: '1rem', height: '1rem', flexShrink: 0, color: 'rgba(255,255,255,0.4)',
          transform: open ? 'rotate(45deg)' : 'none', transition: 'transform 0.15s',
        }} />
      </button>
      {open && (
        <p style={{ padding: '0 1.25rem 1.1rem', margin: 0, fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.65 }}>
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
 * Composição visual do produto: uma janela de navegador com o painel, um
 * telemóvel sobreposto, e chips flutuantes. Representação estilizada — não
 * são capturas reais (essas têm de vir de um PNG na pasta /public, ver nota
 * no chat). A estrutura fica pronta para trocar por <img> quando as tiveres.
 */
function ProductComposition() {
  return (
    <div style={{ position: 'relative', padding: '1rem 0 3rem' }}>
      {/* Janela de navegador */}
      <div style={{
        borderRadius: '0.875rem', border: '1px solid rgba(255,255,255,0.12)',
        background: '#0d0e11', boxShadow: '0 30px 80px -20px rgba(0,0,0,0.6)', overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.9rem',
          borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)',
        }}>
          <span style={{ width: 9, height: 9, borderRadius: '9999px', background: '#ef4444' }} />
          <span style={{ width: 9, height: 9, borderRadius: '9999px', background: '#f59e0b' }} />
          <span style={{ width: 9, height: 9, borderRadius: '9999px', background: '#22c55e' }} />
          <span style={{
            marginLeft: '0.75rem', fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)',
            background: 'rgba(255,255,255,0.04)', padding: '0.15rem 0.6rem', borderRadius: '0.4rem',
          }}>
            wis-services.com
          </span>
        </div>
        <div style={{ display: 'flex', minHeight: '18rem' }}>
          <div style={{ width: '13rem', borderRight: '1px solid rgba(255,255,255,0.06)', padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {['Início', 'Eventos', 'Escalas', 'Ministérios', 'Repertório'].map((item, i) => (
              <div key={item} style={{
                fontSize: '0.75rem', padding: '0.45rem 0.6rem', borderRadius: '0.4rem',
                color: i === 2 ? '#fff' : 'rgba(255,255,255,0.4)',
                background: i === 2 ? 'rgba(143,208,234,0.12)' : 'transparent',
              }}>
                {item}
              </div>
            ))}
          </div>
          <div style={{ flex: 1, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>Culto de Domingo</div>
            {['Louvor · 4', 'Multimédia · 2', 'Sonoplastia · 1'].map((row) => (
              <div key={row} style={{
                fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', padding: '0.6rem 0.75rem',
                borderRadius: '0.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              }}>
                {row}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Telemóvel sobreposto */}
      <div style={{
        position: 'absolute', bottom: '-0.5rem', right: '2%', width: '7.5rem',
        borderRadius: '1.25rem', border: '4px solid #1a1b1f', background: '#0d0e11',
        boxShadow: '0 20px 50px -15px rgba(0,0,0,0.7)', overflow: 'hidden',
      }} className="hidden sm:block">
        <div style={{ padding: '0.75rem 0.6rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#fff' }}>Início</div>
          {['Escala', 'Repertório'].map((row) => (
            <div key={row} style={{
              fontSize: '0.55rem', color: 'rgba(255,255,255,0.5)', padding: '0.4rem 0.5rem',
              borderRadius: '0.35rem', background: 'rgba(255,255,255,0.04)',
            }}>
              {row}
            </div>
          ))}
        </div>
      </div>

      {/* Chips flutuantes */}
      <FloatingChip label="Presença confirmada" top="8%" left="-2%" delay="0s" />
      <FloatingChip label="Escala publicada" top="42%" left="-6%" delay="0.8s" />
      <FloatingChip label="Setlist pronto · 4 músicas" top="76%" left="4%" delay="1.6s" />
    </div>
  );
}

function FloatingChip({ label, top, left, delay }: { label: string; top: string; left: string; delay: string }) {
  return (
    <div
      className="hidden md:flex"
      style={{
        position: 'absolute', top, left,
        alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.8rem', borderRadius: '9999px',
        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)',
        backdropFilter: 'blur(10px)', fontSize: '0.72rem', fontWeight: 600, color: '#fff',
        animation: `wis-float 4s ease-in-out ${delay} infinite`,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '9999px', background: '#8fd0ea' }} />
      {label}
      <style>{`@keyframes wis-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }`}</style>
    </div>
  );
}

function ProductBlock({ n, title, desc, chips, reverse }: {
  n: string; title: string; desc: string;
  chips: { icon: typeof Music2; label: string }[]; reverse: boolean;
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
      <div style={{ direction: 'ltr', display: 'flex', justifyContent: 'center', gap: '1.25rem', position: 'relative', minHeight: '16rem' }}>
        <PhoneMock style={{ transform: 'translateY(1.5rem)' }} />
        <PhoneMock style={{ transform: 'translateY(-1rem)' }} className="hidden sm:block" />
      </div>
    </div>
  );
}

function PhoneMock({ style, className }: { style?: React.CSSProperties; className?: string }) {
  return (
    <div className={className} style={{
      width: '8.5rem', height: '16rem', borderRadius: '1.5rem', border: '5px solid #1a1b1f',
      background: '#0d0e11', boxShadow: '0 25px 60px -20px rgba(0,0,0,0.65)', overflow: 'hidden',
      flexShrink: 0, ...style,
    }}>
      <div style={{ padding: '0.9rem 0.7rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ height: '0.6rem', width: '60%', borderRadius: '0.2rem', background: 'rgba(255,255,255,0.15)' }} />
        {[1, 2, 3].map((i) => (
          <div key={i} style={{
            height: '2.2rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)',
          }} />
        ))}
      </div>
    </div>
  );
}

function WizardMock() {
  const steps = ['Detalhes', 'Ministérios', 'Setlist', 'Roteiro', 'Rever'];
  return (
    <div style={{ ...card, padding: '1.5rem' }}>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {steps.map((s, i) => (
          <span key={s} style={{
            fontSize: '0.72rem', fontWeight: 600, padding: '0.3rem 0.75rem', borderRadius: '9999px',
            background: i === 1 ? '#8fd0ea' : 'rgba(255,255,255,0.05)',
            color: i === 1 ? '#000' : 'rgba(255,255,255,0.45)',
            border: i === 1 ? 'none' : '1px solid rgba(255,255,255,0.1)',
          }}>
            {i + 1}. {s}
          </span>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(9rem, 1fr))', gap: '0.75rem' }}>
        {['Louvor', 'Multimédia', 'Sonoplastia'].map((m) => (
          <div key={m} style={{
            padding: '0.9rem', borderRadius: '0.6rem', background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 700, margin: '0 0 0.3rem' }}>{m}</p>
            <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Escolhe a equipa</p>
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

const badgeStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
  fontSize: '0.72rem', fontWeight: 600, padding: '0.3rem 0.75rem', borderRadius: '9999px',
  background: 'rgba(143,208,234,0.1)', border: '1px solid rgba(143,208,234,0.25)', color: '#8fd0ea',
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
