'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  CalendarCheck, Music2, Users, Bell, ListChecks, Building2,
  BarChart3, Layers, Apple, Play, ArrowRight, ArrowUpRight, Check, Loader2, Menu, X,
} from 'lucide-react';
import { annualSavingsPercent, detectDefaultCurrency, type PlanDef, type Currency } from '@/lib/plans';
import { APP_URL } from '@/lib/app-url';
import { SUPPORT_EMAIL } from '@/lib/email/templates/layout';
import { createCheckoutSessionAction } from '@/actions/stripe-checkout';
import { TearDivider, InkBlob, HandArrow, BrushUnderline, ScribbleCircle, Sparkle } from './Doodles';
import './planos.css';

const INK = '#050505';
const PAPER = '#f3f1ec';

const NAV = [
  { href: '#recursos', label: 'Recursos' },
  { href: '#planos', label: 'Planos', current: true },
  { href: '#como-funciona', label: 'Como funciona' },
  { href: '#faq', label: 'FAQ' },
];

const FEATURES = [
  { icon: CalendarCheck, label: 'Escalas inteligentes', desc: 'Crie escalas em segundos e evite sobreposições.' },
  { icon: ListChecks, label: 'Eventos e cultos', desc: 'Planeje cada culto com antecedência.' },
  { icon: Music2, label: 'Setlists e repertório', desc: 'Organize músicas, tom e andamento.' },
  { icon: Bell, label: 'Confirmações', desc: 'Notificações automáticas e confirmação de presença.' },
  { icon: Layers, label: 'Ministérios e funções', desc: 'Estruture ministérios e atribua funções.' },
  { icon: Users, label: 'Pessoas e equipes', desc: 'Gerencie membros e líderes.' },
  { icon: BarChart3, label: 'Relatórios e insights', desc: 'Acompanhe participação e histórico.' },
  { icon: Building2, label: 'Multi-organização', desc: 'Gerencie várias igrejas em uma conta.' },
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

/** Uma linha de posicionamento por plano — ajuda a ler a escada de cima a baixo. */
const PLAN_TAGLINES: Record<string, string> = {
  semente: 'Para começar',
  broto: 'Para equipes em crescimento',
  colheita: 'Para igrejas sem limites',
};

const METRICS = [
  { value: '7', label: 'módulos integrados' },
  { value: 'PWA', label: 'instala sem loja' },
  { value: '1 conta', label: 'várias igrejas' },
  { value: '€ / R$', label: 'Portugal e Brasil' },
];

const STEPS = [
  { n: '01', title: 'Crie a organização', desc: 'Cadastre sua igreja em poucos minutos, sem cartão de crédito.' },
  { n: '02', title: 'Defina os ministérios', desc: 'Crie ministérios e funções do seu jeito.' },
  { n: '03', title: 'Convide a equipe', desc: 'Convide membros e líderes por código ou email.' },
  { n: '04', title: 'Publique o culto', desc: 'Monte escalas, setlist e compartilhe com todos.' },
];

const FAQ: { q: string; a: string }[] = [
  { q: 'Posso cancelar quando quiser?', a: 'Sim. A assinatura é gerida por você no portal de faturamento e pode ser cancelada a qualquer momento — o plano continua ativo até o fim do período já pago, e depois sua organização volta ao plano gratuito sem perder os dados.' },
  { q: 'Existe período de teste?', a: 'O plano Semente é gratuito e não pede cartão, então você pode usar o WIS de verdade com sua equipe antes de decidir. Quando precisar de mais pessoas, ministérios ou recursos, é só mudar de plano.' },
  { q: 'Como funciona o upgrade de plano?', a: 'Você escolhe o novo plano aqui mesmo e o pagamento é feito de forma segura via Stripe. Os novos limites e recursos passam a valer imediatamente — não é preciso recriar nada.' },
  { q: 'Posso mudar de plano depois?', a: 'Pode subir ou descer de plano quando quiser. Ao descer, confira antes se sua igreja está dentro dos limites do plano menor (pessoas, ministérios e líderes).' },
  { q: 'Os dados da minha igreja estão seguros?', a: 'Cada organização só enxerga os próprios dados, com regras de acesso aplicadas no banco de dados e não apenas na interface. Os pagamentos passam pelo Stripe — nenhum dado de cartão chega aos nossos servidores.' },
  { q: 'Posso gerenciar mais de uma igreja?', a: 'Sim. Uma conta pode participar de várias organizações, e você troca entre elas dentro do app sem precisar sair e entrar de novo.' },
];

function fmtPrice(v: number, currency: Currency = 'EUR'): string {
  const n = v.toFixed(2).replace('.', ',');
  return currency === 'BRL' ? `R$ ${n}` : `${n}€`;
}

/**
 * Revela o bloco ao entrar no ecrã. O estado escondido é aplicado pelo
 * próprio JS na montagem (ref callback, antes da pintura) — sem JS, ou se o
 * IntersectionObserver falhar, o conteúdo fica simplesmente visível.
 */
function Reveal({ children, className = '', id }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);

  const attach = (el: HTMLDivElement | null) => {
    ref.current = el;
    if (el && typeof IntersectionObserver !== 'undefined') el.classList.add('wis-reveal-armed');
  };

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('is-in'); io.disconnect(); } },
      { rootMargin: '0px 0px -8% 0px' },
    );
    io.observe(el);
    // Rede de segurança: se por algum motivo o observer não disparar,
    // o conteúdo aparece na mesma.
    const t = setTimeout(() => el.classList.add('is-in'), 1500);
    return () => { io.disconnect(); clearTimeout(t); };
  }, []);

  return <div ref={attach} id={id} className={className}>{children}</div>;
}

interface Props { plans: PlanDef[]; adminOrgId: string | null }

export function PlanosClient({ plans, adminOrgId }: Props) {
  const [annual, setAnnual] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [currency, setCurrency] = useState<Currency>('EUR');

  useEffect(() => { setCurrency(detectDefaultCurrency()); }, []);

  return (
    <div className="wis-lp">

      {/* ── Header ─────────────────────────────────────── */}
      <header className="wis-header">
        <div className="wis-header-inner">
          <Link href="/" aria-label="WIS — Worship In Sync, página inicial"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none', flexShrink: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/wis-symbol-white.svg" alt="" style={{ width: '1.9rem', height: '1.9rem' }} />
            <span style={{ lineHeight: 1 }}>
              <strong style={{ display: 'block', color: PAPER, fontSize: '1.1rem', fontWeight: 900, letterSpacing: '0.02em' }}>WIS</strong>
              <span style={{ display: 'block', fontSize: '0.6rem', letterSpacing: '0.12em', color: 'rgba(243,241,236,0.5)', textTransform: 'uppercase' }}>
                Worship In Sync
              </span>
            </span>
          </Link>

          <nav className="wis-nav" aria-label="Navegação da página">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className={n.current ? 'is-current' : undefined}>{n.label}</a>
            ))}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
            <a href={APP_URL} target="_blank" rel="noopener noreferrer" className="wis-btn wis-btn-outline wis-btn-sm" style={{ boxShadow: 'none' }}>
              Entrar na app
            </a>
            <button
              type="button"
              className="wis-burger"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="wis-mobile-nav" aria-label="Navegação móvel">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} onClick={() => setMenuOpen(false)}>{n.label}</a>
            ))}
          </nav>
        )}
      </header>

      {/* ── Hero ───────────────────────────────────────── */}
      <section className="wis-grain" style={{ background: INK }}>
        <div className="wis-wrap">
          <div className="wis-hero">
            <div>
              <span className="wis-hero-badge">WIS — Services</span>

              <h1 className="wis-display wis-h1">
                Organize sua igreja.<br />
                Foque no que importa:<br />
                <span className="wis-blue">Adoração.</span>
              </h1>

              <p className="wis-hero-lead">
                O WIS ajuda líderes a organizar ministérios, escalas, eventos e repertórios.
                Tudo em um só lugar, para que a sua equipe esteja sempre em sintonia.
              </p>

              <div className="wis-hero-ctas">
                <Link href="/register" className="wis-btn wis-btn-blue">
                  Começar grátis <ArrowRight size={17} />
                </Link>
                <a href="#planos" className="wis-btn wis-btn-outline">Ver planos</a>
              </div>

              <p className="wis-nocard">
                <Check size={14} className="wis-blue" aria-hidden />
                Não é necessário cartão de crédito
              </p>
            </div>

            {/* Composição: tinta + halftone + captura real do app */}
            <div className="wis-hero-art">
              <InkBlob className="wis-ink-blob wis-blue" />
              <span className="wis-halftone" aria-hidden />

              <div className="wis-phone">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/screenshots/mobile-eventos-equipa.webp"
                  alt="Tela do WIS no celular, com a equipe escalada de um culto e as confirmações de presença"
                  width={390}
                  height={792}
                  fetchPriority="high"
                />
              </div>

              <span className="wis-note" style={{ top: '4%', left: '-2%' }}>
                Mais tempo para o que realmente importa.
              </span>

              <Sparkle style={{ position: 'absolute', bottom: '12%', right: '4%', width: '1.7rem', color: 'var(--yellow)', zIndex: 4 }} />
              <Sparkle style={{ position: 'absolute', bottom: '5%', right: '13%', width: '1rem', color: 'var(--yellow)', zIndex: 4 }} />
            </div>
          </div>
        </div>
      </section>

      <TearDivider fill={PAPER} />

      {/* ── Recursos ───────────────────────────────────── */}
      <section id="recursos" className="wis-paper wis-grain" style={{ paddingBottom: '1rem' }}>
        <div className="wis-wrap" style={{ paddingTop: '3rem' }}>
          <Reveal>
            <p className="wis-kicker">Recursos</p>
            <h2 className="wis-display wis-h2" style={{ marginTop: '0.75rem', maxWidth: '20ch' }}>
              Tudo que sua igreja precisa para estar{' '}
              <span style={{ position: 'relative', display: 'inline-block' }}>
                <span className="wis-blue">em sintonia</span>
                <BrushUnderline style={{ position: 'absolute', left: 0, bottom: '-0.1em', width: '100%', height: '0.13em', color: 'var(--blue)' }} />
              </span>
            </h2>

            <div className="wis-feature-grid">
              {FEATURES.map((f) => (
                <div key={f.label} className="wis-feature">
                  <f.icon size={26} strokeWidth={1.6} aria-hidden />
                  <h3>{f.label}</h3>
                  <p>{f.desc}</p>
                </div>
              ))}
            </div>
          </Reveal>

          {/* ── Métricas ─────────────────────────────────── */}
          <div className="wis-metrics wis-grain" role="group" aria-label="O WIS em números">
            <div className="wis-metrics-inner">
              {METRICS.map((m) => (
                <div key={m.label} className="wis-metric">
                  <b>{m.value}</b>
                  <span>{m.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Como funciona ────────────────────────────── */}
          <Reveal id="como-funciona">
            <div style={{ paddingTop: '2rem' }}>
              <p className="wis-kicker">Como funciona</p>
              <h2 className="wis-display wis-h2" style={{ marginTop: '0.75rem' }}>
                Começar é<br /><span className="wis-blue">muito simples</span>
              </h2>

              <div className="wis-steps">
                {STEPS.map((s) => (
                  <div key={s.n} className="wis-step">
                    <span className="wis-step-n" aria-hidden>{s.n}</span>
                    <h3>{s.title}</h3>
                    <p>{s.desc}</p>
                    <HandArrow className="wis-step-arrow" />
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <div style={{ height: '3rem' }} />
        </div>
      </section>

      <TearDivider fill={INK} />

      {/* ── Planos ─────────────────────────────────────── */}
      <section id="planos" className="wis-grain" style={{ background: INK, paddingTop: '2.5rem', paddingBottom: '4rem' }}>
        <div className="wis-wrap">
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '1.5rem',
            alignItems: 'flex-end', justifyContent: 'space-between',
          }}>
            <div>
              <p className="wis-kicker" style={{ color: 'var(--blue)' }}>Planos</p>
              <h2 className="wis-display wis-h2" style={{ marginTop: '0.75rem' }}>
                Escolha o plano<br />
                <span style={{ position: 'relative', display: 'inline-block' }}>
                  <span className="wis-blue">ideal</span>
                  <ScribbleCircle style={{ position: 'absolute', left: '-13%', top: '-16%', width: '126%', height: '132%', color: 'var(--blue)' }} />
                </span>{' '}
                para sua igreja
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                <div className="wis-toggle" role="group" aria-label="Periodicidade da cobrança">
                  <button type="button" onClick={() => setAnnual(false)} aria-pressed={!annual}>Mensal</button>
                  <button type="button" onClick={() => setAnnual(true)} aria-pressed={annual}>Anual</button>
                </div>
                <div className="wis-toggle" role="group" aria-label="Moeda">
                  <button type="button" onClick={() => setCurrency('EUR')} aria-pressed={currency === 'EUR'}>€ EUR</button>
                  <button type="button" onClick={() => setCurrency('BRL')} aria-pressed={currency === 'BRL'}>R$ BRL</button>
                </div>
              </div>
              <p className="wis-hand" style={{ fontSize: '0.86rem', color: 'var(--yellow)', margin: 0, maxWidth: '15rem' }}>
                No plano anual você paga 10 meses e usa 12!
              </p>
            </div>
          </div>

          <div className="wis-plan-grid">
            {plans.map((plan, i) => (
              <PlanCard
                key={plan.key}
                plan={plan}
                tier={i}
                annual={annual}
                currency={currency}
                previousFeatures={i > 0 ? plans[i - 1].features : []}
                previousLabel={i > 0 ? plans[i - 1].label : null}
                adminOrgId={adminOrgId}
              />
            ))}
          </div>

          <p style={{ fontSize: '0.8rem', color: 'rgba(243,241,236,0.4)', marginTop: '1.75rem', textAlign: 'center' }}>
            Comece grátis no Semente, sem cartão. Os planos pagos são cobrados de forma segura via Stripe.
          </p>
        </div>
      </section>

      <TearDivider fill={PAPER} />

      {/* ── FAQ ────────────────────────────────────────── */}
      <section id="faq" className="wis-paper wis-grain">
        <div className="wis-wrap" style={{ paddingTop: '3rem', paddingBottom: '3.5rem' }}>
          <Reveal>
            <p className="wis-kicker">FAQ</p>
            <h2 className="wis-display wis-h2" style={{ margin: '0.75rem 0 2rem' }}>
              Perguntas<br />frequentes
            </h2>

            <div className="wis-faq">
              {FAQ.map((item) => <FaqItem key={item.q} {...item} />)}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Instalação PWA ─────────────────────────────── */}
      <section className="wis-install-section wis-grain">
        <div className="wis-wrap">
          <Reveal>
            <div className="wis-install-dark">
              <div className="wis-install-dark-text">
                <h2 className="wis-display wis-h2" style={{ color: '#fff' }}>
                  Domingo já vem aí. <span style={{ color: 'rgba(255,255,255,0.45)' }}>Organize sua equipe hoje.</span>
                </h2>
                <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: 'rgba(255,255,255,0.6)', margin: '1.25rem 0 0', maxWidth: '30rem' }}>
                  Descarrega para iOS ou Android — ou usa já no navegador. O WIS instala-se
                  no ecrã inicial sem passar por nenhuma loja e continua a abrir sem rede.
                </p>

                <div className="wis-store-row">
                  <span className="wis-store-btn">
                    <Apple size={18} strokeWidth={1.8} aria-hidden />
                    App Store
                  </span>
                  <span className="wis-store-btn">
                    <Play size={16} strokeWidth={1.8} aria-hidden />
                    Google Play
                  </span>
                  <a href={APP_URL} target="_blank" rel="noopener noreferrer" className="wis-store-btn wis-store-btn-solid">
                    Entrar na PWA <ArrowUpRight size={16} />
                  </a>
                </div>
              </div>

              <div className="wis-phones-duo">
                <InkBlob className="wis-ink-blob wis-blue" />
                <div className="wis-phone wis-phone-back">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/screenshots/mobile-eventos-equipa.webp"
                    alt="Tela do WIS no celular, com a equipe escalada de um culto"
                    loading="lazy"
                    width={390}
                    height={792}
                  />
                </div>
                <div className="wis-phone wis-phone-front">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/screenshots/mobile-setlist.webp"
                    alt="Setlist de um culto no WIS pelo celular, com tom e BPM de cada música"
                    loading="lazy"
                    width={390}
                    height={792}
                  />
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Rodapé ─────────────────────────────────────── */}
      <footer className="wis-footer">
        <div className="wis-wrap wis-footer-grid">
          <div>
            <strong style={{ fontSize: '1.05rem', fontWeight: 900 }}>WIS <span className="wis-blue">· Services</span></strong>
            <p style={{ fontSize: '0.82rem', color: 'rgba(243,241,236,0.45)', marginTop: '0.6rem', lineHeight: 1.6, maxWidth: '18rem' }}>
              Gestão de ministérios de igreja — escalas, eventos e repertório.
            </p>
          </div>
          <FooterCol title="Produto" links={[
            { href: '#recursos', label: 'Recursos' },
            { href: '#planos', label: 'Planos' },
            { href: APP_URL, label: 'Entrar na app' },
          ]} />
          <FooterCol title="Legal" links={[
            { href: '/termos', label: 'Termos de Uso' },
            { href: '/privacidade', label: 'Privacidade' },
          ]} />
          <FooterCol title="Suporte" links={[
            { href: '/suporte', label: 'Central de ajuda' },
            { href: `mailto:${SUPPORT_EMAIL}`, label: SUPPORT_EMAIL },
          ]} />
        </div>
        <p style={{ fontSize: '0.75rem', color: 'rgba(243,241,236,0.3)', textAlign: 'center', marginTop: '2.5rem' }}>
          © {new Date().getUTCFullYear()} WIS - Services
        </p>
      </footer>
    </div>
  );
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <p className="wis-kicker" style={{ color: 'rgba(243,241,236,0.4)', marginBottom: '0.75rem' }}>{title}</p>
      {links.map((l) => <Link key={l.label} href={l.href}>{l.label}</Link>)}
    </div>
  );
}

// ── Cartão de plano ─────────────────────────────────────────────────────────

function PlanCard({ plan, tier, annual, currency, previousFeatures, previousLabel, adminOrgId }: {
  plan: PlanDef; tier: number; annual: boolean; currency: Currency;
  previousFeatures: string[]; previousLabel: string | null; adminOrgId: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const monthlyPrice = currency === 'BRL' ? plan.priceMonthlyBRL : plan.priceMonthly;
  const annualPrice = currency === 'BRL' ? plan.priceAnnualBRL : plan.priceAnnual;
  const price = annual ? annualPrice : monthlyPrice;
  const savings = annualSavingsPercent(plan, currency);
  const popular = plan.key === 'colheita';

  async function handleAssinar() {
    if (!adminOrgId) return;
    setLoading(true);
    try {
      const result = await createCheckoutSessionAction(adminOrgId, plan.key, annual ? 'annual' : 'monthly', currency);
      if (result.ok) {
        window.location.href = result.url;
        return;
      }
      toast.error(result.message);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao iniciar o checkout');
    } finally {
      setLoading(false);
    }
  }

  // Só mostra o que o plano acrescenta ao anterior — os planos são
  // cumulativos, então repetir tudo de novo em cada cartão é ruído.
  const newFeatures = plan.features.filter((f) => !previousFeatures.includes(f));

  const limits = [
    { n: plan.maxPeople === null ? 'Ilimitadas' : String(plan.maxPeople), l: 'pessoas' },
    { n: plan.maxMinistries === null ? 'Ilimitados' : String(plan.maxMinistries), l: `ministério${plan.maxMinistries === 1 ? '' : 's'}` },
    { n: plan.maxLeaders === null ? 'Ilimitados' : String(plan.maxLeaders), l: `líder${plan.maxLeaders === 1 ? '' : 'es'}` },
  ];

  return (
    <div className="wis-plan" data-tier={tier}>
      {popular && <span className="wis-plan-flag">Recomendado</span>}

      <h3 className="wis-plan-name">{plan.label}</h3>
      <p className="wis-plan-tagline">{PLAN_TAGLINES[plan.key] ?? ''}</p>

      <p className="wis-price">
        {fmtPrice(price, currency)}
        <small>/{annual ? 'ano' : 'mês'}</small>
      </p>

      {monthlyPrice === 0 ? (
        <p className="wis-price-alt">Grátis</p>
      ) : (
        <p className="wis-price-alt">
          {annual
            ? `${fmtPrice(monthlyPrice, currency)} se pagar ao mês`
            : `${fmtPrice(annualPrice, currency)} no plano anual`}
          {savings > 0 && <span className="wis-save-tag">{savings}% off</span>}
        </p>
      )}

      <ul className="wis-limits">
        {limits.map((x) => (
          <li key={x.l}><span>{x.n}</span> <em>{x.l}</em></li>
        ))}
      </ul>

      <ul className="wis-plan-features">
        {previousLabel && newFeatures.length > 0 && (
          <li className="wis-plan-inherits" style={{ color: 'rgba(243,241,236,0.4)' }}>
            Tudo do {previousLabel}, mais:
          </li>
        )}
        {plan.features.length === 0 ? (
          <>
            <li><Check size={14} aria-hidden />Escalas básicas</li>
            <li><Check size={14} aria-hidden />Acesso do voluntário ao app</li>
          </>
        ) : newFeatures.map((f) => (
          <li key={f}><Check size={14} aria-hidden />{FEATURE_LABELS[f] ?? f}</li>
        ))}
      </ul>

      {plan.priceMonthly === 0 || !adminOrgId ? (
        <Link href="/register" className={`wis-btn ${popular ? 'wis-btn-blue' : 'wis-btn-outline'}`}>
          {plan.priceMonthly === 0 ? 'Começar grátis' : 'Escolher plano'}
        </Link>
      ) : (
        <button
          type="button"
          onClick={handleAssinar}
          disabled={loading}
          className={`wis-btn ${popular ? 'wis-btn-blue' : 'wis-btn-outline'}`}
          style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'wait' : 'pointer' }}
        >
          {loading && <Loader2 size={15} className="animate-spin" aria-hidden />}
          Escolher plano
        </button>
      )}
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  const id = q.replace(/\W+/g, '-').toLowerCase();
  return (
    <div className="wis-faq-item">
      <h3 style={{ margin: 0 }}>
        <button
          type="button"
          className="wis-faq-q"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={`faq-${id}`}
        >
          {q}
          <span className="wis-faq-sign" aria-hidden>+</span>
        </button>
      </h3>
      {open && <p className="wis-faq-a" id={`faq-${id}`}>{a}</p>}
    </div>
  );
}
