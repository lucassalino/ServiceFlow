'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  CalendarCheck, Music2, Users, Bell, Smartphone, WifiOff,
  CalendarSync, ListChecks, ChevronDown, ExternalLink, Check, Sparkles,
} from 'lucide-react';
import { PLAN_LIST, annualSavingsPercent, type PlanDef } from '@/lib/plans';
import { APP_URL } from '@/lib/app-url';
import { SUPPORT_EMAIL } from '@/lib/email/templates/layout';

const NAV = [
  { href: '#funcionalidades', label: 'Funcionalidades' },
  { href: '#planos', label: 'Planos' },
  { href: '#app', label: 'App' },
  { href: '#faq', label: 'FAQ' },
];

const FEATURES = [
  { icon: CalendarCheck, label: 'Escalas inteligentes', desc: 'Escala a equipa respeitando as indisponibilidades de cada pessoa, com aviso automático de conflitos.' },
  { icon: ListChecks, label: 'Eventos com roteiro', desc: 'Ministérios, setlist e a ordem do culto, tudo num só sítio.' },
  { icon: Music2, label: 'Repertório partilhado', desc: 'Tom, BPM, letras e cifras — com catálogo global entre igrejas e importação por CSV.' },
  { icon: CalendarSync, label: 'Sincronização de calendário', desc: 'Subscreve as tuas escalas no Google ou Apple Calendar. Mudou a escala? O teu calendário acompanha.' },
  { icon: Bell, label: 'Avisos por 3 canais', desc: 'Notificação na app, WhatsApp e email — a equipa escolhe a quem avisar.' },
  { icon: Users, label: 'Multi-ministério', desc: 'Ministérios e funções à tua medida, com histórico de participação de cada voluntário.' },
  { icon: WifiOff, label: 'Funciona offline', desc: 'É uma PWA — instala-se no ecrã inicial, sem loja, e continua a funcionar sem rede.' },
  { icon: Sparkles, label: 'Relatórios de engajamento', desc: 'Frequência de participação e distribuição por ministério, por período.' },
];

const STEPS = [
  { n: '1', title: 'Cria a organização', desc: 'Em menos de um minuto, sem cartão de crédito.' },
  { n: '2', title: 'Convida a equipa', desc: 'Por código de convite ou email — cada pessoa entra com a sua conta.' },
  { n: '3', title: 'Escala e publica', desc: 'Monta a escala, publica, e avisa por app, WhatsApp ou email.' },
];

const FAQ: { q: string; a: string }[] = [
  { q: 'Preciso de instalar alguma coisa?', a: 'Não. O WIS é uma PWA — abre no navegador e podes "instalá-la" no ecrã inicial do telemóvel diretamente a partir daí, sem passar pela App Store ou Google Play.' },
  { q: 'Funciona offline?', a: 'Sim, para o que já foi carregado antes de perderes ligação. Quando a rede voltar, a app sincroniza sozinha.' },
  { q: 'Posso importar o meu repertório atual?', a: 'Sim — o Repertório tem um importador de CSV com mapeamento de colunas, para trazeres as tuas músicas de uma vez.' },
  { q: 'Como funcionam os planos?', a: 'Cada plano define quantas pessoas, ministérios e administradores cabem na tua organização, e que funcionalidades extra estão incluídas. Podes começar grátis e mudar de plano depois.' },
  { q: 'Os meus dados estão seguros?', a: 'Sim. Cada organização só vê os seus próprios dados — a separação é garantida ao nível da base de dados (Row Level Security), não apenas na aplicação.' },
  { q: 'Uma igreja com vários campus, como faz?', a: 'Por agora, cria uma organização (e uma assinatura) por campus. É a forma mais simples de manter os dados de cada campus separados.' },
];

function fmtPrice(v: number): string {
  return v === 0 ? 'Grátis' : `${v.toFixed(2).replace('.', ',')} €`;
}

export function PlanosClient() {
  const [annual, setAnnual] = useState(false);

  return (
    <div style={{ minHeight: '100dvh', background: '#000', color: '#fff' }}>
      <BackgroundGlow />

      {/* ── Header ─────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 40,
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        background: 'rgba(0,0,0,0.72)', borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{
          maxWidth: '72rem', margin: '0 auto', padding: '0.875rem 1.25rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
        }}>
          <Link href="/" style={{ fontSize: '1rem', fontWeight: 800, letterSpacing: '-0.01em', color: '#fff', textDecoration: 'none', flexShrink: 0 }}>
            WIS <span style={{ color: '#a5b4fc' }}>· Services</span>
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
              Entrar na PWA
            </a>
            <a href="#planos" style={primaryBtn}>
              Começar grátis
            </a>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────── */}
      <section style={{ maxWidth: '72rem', margin: '0 auto', padding: '4.5rem 1.25rem 3.5rem', textAlign: 'center' }}>
        <span style={badgeStyle}>
          <WifiOff style={{ width: '0.7rem', height: '0.7rem' }} />
          Instalável como app · Funciona offline
        </span>
        <h1 style={{
          fontSize: 'clamp(2rem, 5vw, 3.25rem)', fontWeight: 800, letterSpacing: '-0.03em',
          lineHeight: 1.08, margin: '1.25rem auto 1rem', maxWidth: '42rem',
        }}>
          Escalas, eventos e repertório da tua igreja, em sincronia.
        </h1>
        <p style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.55)', maxWidth: '34rem', margin: '0 auto 2rem', lineHeight: 1.6 }}>
          Chega de grupos de WhatsApp e folhas soltas. O WIS organiza a tua equipa de
          louvor — escalas, repertório e avisos — num só sítio.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="#planos" style={{ ...primaryBtn, padding: '0.75rem 1.5rem', fontSize: '0.95rem' }}>
            Começar grátis
          </a>
          <a href={APP_URL} target="_blank" rel="noopener noreferrer" style={{ ...ghostBtn, padding: '0.75rem 1.5rem', fontSize: '0.95rem' }}>
            Ver a app <ExternalLink style={{ width: '0.8rem', height: '0.8rem' }} />
          </a>
        </div>
      </section>

      {/* ── Funcionalidades ────────────────────────────── */}
      <section id="funcionalidades" style={{ maxWidth: '72rem', margin: '0 auto', padding: '2rem 1.25rem 4rem' }}>
        <SectionTitle kicker="Funcionalidades" title="Tudo o que a tua equipa precisa" />
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(15.5rem, 1fr))', gap: '1rem', marginTop: '2rem',
        }}>
          {FEATURES.map((f) => (
            <div key={f.label} style={card}>
              <div style={{
                width: '2.5rem', height: '2.5rem', borderRadius: '0.7rem', marginBottom: '0.875rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(165,180,252,0.12)', border: '1px solid rgba(165,180,252,0.25)',
              }}>
                <f.icon style={{ width: '1.1rem', height: '1.1rem', color: '#a5b4fc' }} />
              </div>
              <p style={{ fontSize: '0.92rem', fontWeight: 700, margin: '0 0 0.35rem' }}>{f.label}</p>
              <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Como funciona ──────────────────────────────── */}
      <section style={{ maxWidth: '72rem', margin: '0 auto', padding: '1rem 1.25rem 4rem' }}>
        <SectionTitle kicker="Como funciona" title="A tua equipa organizada em 3 passos" />
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))', gap: '1.25rem', marginTop: '2rem',
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
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
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
          {PLAN_LIST.map((plan) => (
            <PlanCard key={plan.key} plan={plan} annual={annual} />
          ))}
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', marginTop: '1.5rem' }}>
          Sem cartão para começar. O pagamento de planos pagos chega em breve — regista-te
          já e fala connosco para ativar o teu plano.
        </p>
      </section>

      {/* ── App / Entrar na PWA ────────────────────────── */}
      <section id="app" style={{ maxWidth: '72rem', margin: '0 auto', padding: '1rem 1.25rem 4rem' }}>
        <div style={{
          ...card, padding: '2.5rem 1.75rem', textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(165,180,252,0.08), rgba(139,92,246,0.06))',
        }}>
          <Smartphone style={{ width: '2rem', height: '2rem', color: '#a5b4fc', margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 0.5rem' }}>
            Leva o WIS contigo
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', maxWidth: '28rem', margin: '0 auto 1.75rem', lineHeight: 1.6 }}>
            Usa já no navegador — a PWA instala-se no ecrã inicial sem passar por
            loja nenhuma. A app nativa para iOS e Android está a caminho.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            <span style={storeBadge}>App Store <em style={soonTag}>Em breve</em></span>
            <span style={storeBadge}>Google Play <em style={soonTag}>Em breve</em></span>
          </div>

          <a href={APP_URL} target="_blank" rel="noopener noreferrer" style={{ ...primaryBtn, padding: '0.75rem 1.5rem', fontSize: '0.9rem' }}>
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
          background: 'linear-gradient(135deg, rgba(165,180,252,0.1), rgba(139,92,246,0.08))',
        }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 0.75rem' }}>
            Pronto para organizar a tua equipa?
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
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '2rem 1.25rem' }}>
        <div style={{
          maxWidth: '72rem', margin: '0 auto', display: 'flex', flexWrap: 'wrap',
          gap: '1rem', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>WIS <span style={{ color: '#a5b4fc' }}>· Services</span></span>
          <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
            <Link href="/privacidade" style={footerLink}>Privacidade</Link>
            <Link href="/suporte" style={footerLink}>Suporte</Link>
            <a href={`mailto:${SUPPORT_EMAIL}`} style={footerLink}>{SUPPORT_EMAIL}</a>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>
            © {new Date().getUTCFullYear()} WIS - Services
          </span>
        </div>
      </footer>
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
      border: popular ? '1px solid rgba(165,180,252,0.4)' : card.border,
      background: popular ? 'rgba(165,180,252,0.05)' : card.background,
    }}>
      {popular && (
        <span style={{
          position: 'absolute', top: '-0.7rem', left: '50%', transform: 'translateX(-50%)',
          fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '9999px',
          background: '#a5b4fc', color: '#000', whiteSpace: 'nowrap',
        }}>
          Mais popular
        </span>
      )}

      <p style={{ fontSize: '0.95rem', fontWeight: 800, margin: '0 0 0.5rem' }}>{plan.label}</p>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', marginBottom: '0.25rem' }}>
        <span style={{ fontSize: '1.6rem', fontWeight: 800, color: price === 0 ? '#6ee7b7' : '#fff' }}>
          {fmtPrice(price)}
        </span>
        {price > 0 && <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>/ {annual ? 'ano' : 'mês'}</span>}
      </div>
      {annual && savings > 0 && (
        <p style={{ fontSize: '0.72rem', color: '#6ee7b7', margin: '0 0 1rem' }}>Poupas {savings}% no anual</p>
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
            <Check style={{ width: '0.85rem', height: '0.85rem', color: '#a5b4fc', flexShrink: 0, marginTop: '0.15rem' }} />
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
        {plan.priceMonthly === 0 ? 'Começar grátis' : 'Escolher plano'}
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
        <ChevronDown style={{
          width: '1rem', height: '1rem', flexShrink: 0, color: 'rgba(255,255,255,0.4)',
          transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s',
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
        'radial-gradient(ellipse 60% 45% at 50% -8%, rgba(165,180,252,0.14) 0%, transparent 65%),' +
        'radial-gradient(ellipse 40% 35% at 85% 15%, rgba(139,92,246,0.08) 0%, transparent 55%)',
    }} />
  );
}

const card: React.CSSProperties = {
  position: 'relative', zIndex: 1,
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
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
  background: 'rgba(165,180,252,0.1)', border: '1px solid rgba(165,180,252,0.25)', color: '#a5b4fc',
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
