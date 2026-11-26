'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  CalendarCheck, Music2, Users, Bell, ListChecks, Building2,
  BarChart3, Layers, ArrowRight, ArrowUpRight, Check, Loader2, Menu, X, ChevronDown,
} from 'lucide-react';
import { annualSavingsPercent, detectDefaultCurrency, type PlanDef, type Currency } from '@/lib/plans';
import { APP_URL } from '@/lib/app-url';
import { SUPPORT_EMAIL } from '@/lib/email/templates/layout';
import { createCheckoutSessionAction } from '@/actions/stripe-checkout';
import {
  NAV_LABELS, HERO, RECURSOS, FEATURES, METRICS, COMO_FUNCIONA, PLANOS,
  FAQ_TITULO, FAQ, INSTALACAO, FOOTER, AVISO_CHECKOUT,
} from './conteudo';
import './planos.css';

const FEATURE_ICONS = [CalendarCheck, ListChecks, Music2, Bell, Layers, Users, BarChart3, Building2];

const NAV = [
  { href: '#recursos', label: NAV_LABELS.recursos },
  { href: '#planos', label: NAV_LABELS.planos },
  { href: '#como-funciona', label: NAV_LABELS.comoFunciona },
  { href: '#faq', label: NAV_LABELS.faq },
];

/** Rótulos pt-BR das chaves de `plans.features` (landing pública). */
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

function fmtPrice(v: number, currency: Currency = 'EUR'): string {
  const n = v.toFixed(2).replace('.', ',');
  return currency === 'BRL' ? `R$ ${n}` : `${n}€`;
}

/** Revela o bloco ao entrar no ecrã. Sem JS, o conteúdo fica visível. */
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
    const t = setTimeout(() => el.classList.add('is-in'), 1500);
    return () => { io.disconnect(); clearTimeout(t); };
  }, []);

  return <div ref={attach} id={id} className={className}>{children}</div>;
}

interface Props { plans: PlanDef[]; adminOrgId: string | null; initialCurrency?: Currency }

export function PlanosClient({ plans, adminOrgId, initialCurrency }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [currency, setCurrency] = useState<Currency>(initialCurrency ?? 'EUR');

  useEffect(() => {
    if (!initialCurrency) setCurrency(detectDefaultCurrency());
  }, [initialCurrency]);

  return (
    <div className="wis-lp">
      {/* ── Header ───────────────────────────────────── */}
      <header className="wis-header">
        <div className="wis-header-inner">
          <Link href="/" aria-label="WIS — Worship In Sync, página inicial" className="wis-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/wis-symbol-white.svg" alt="" width={28} height={28} />
            <span className="wis-brand-text">
              <strong>WIS</strong>
              <span>Worship In Sync</span>
            </span>
          </Link>

          <nav className="wis-nav" aria-label="Navegação da página">
            {NAV.map((n) => <a key={n.href} href={n.href}>{n.label}</a>)}
          </nav>

          <div className="wis-header-actions">
            <a href={APP_URL} target="_blank" rel="noopener noreferrer" className="wis-btn wis-btn-outline wis-btn-sm">
              {NAV_LABELS.entrarNaApp}
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
            {NAV.map((n) => <a key={n.href} href={n.href} onClick={() => setMenuOpen(false)}>{n.label}</a>)}
          </nav>
        )}
      </header>

      {/* ── Hero ─────────────────────────────────────── */}
      <section className="wis-hero-section">
        <div className="wis-wrap wis-hero">
          <div className="wis-hero-copy">
            <span className="wis-badge">{HERO.badge}</span>

            <h1 className="wis-h1">
              {HERO.titulo.map((linha, i) => (
                <span key={i} className={i === HERO.titulo.length - 1 ? 'wis-accent' : undefined}>
                  {linha}
                  {i < HERO.titulo.length - 1 && <br />}
                </span>
              ))}
            </h1>

            <p className="wis-lead">{HERO.lead}</p>

            <div className="wis-hero-ctas">
              <Link href="/register" className="wis-btn wis-btn-blue">
                {HERO.ctaPrincipal} <ArrowRight size={17} />
              </Link>
              <a href="#planos" className="wis-btn wis-btn-outline">{HERO.ctaSecundario}</a>
            </div>

            <p className="wis-nocard">
              <Check size={14} aria-hidden /> {HERO.semCartao}
            </p>
          </div>

          <div className="wis-hero-visual">
            <div className="wis-glow" aria-hidden />
            <div className="wis-device">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/screenshots/mobile-eventos-equipa.webp"
                alt={HERO.imagemAlt}
                width={390}
                height={792}
                fetchPriority="high"
              />
            </div>
            <span className="wis-float-note">{HERO.notaFlutuante}</span>
          </div>
        </div>
      </section>

      {/* ── Recursos ─────────────────────────────────── */}
      <section id="recursos" className="wis-section">
        <div className="wis-wrap">
          <Reveal>
            <p className="wis-kicker">{RECURSOS.kicker}</p>
            <h2 className="wis-h2">{RECURSOS.titulo}</h2>

            <div className="wis-feature-grid">
              {FEATURES.map((f, i) => {
                const Icon = FEATURE_ICONS[i];
                return (
                  <div key={f.label} className="wis-card wis-feature">
                    <span className="wis-icon-tile"><Icon size={20} strokeWidth={1.7} aria-hidden /></span>
                    <h3>{f.label}</h3>
                    <p>{f.desc}</p>
                  </div>
                );
              })}
            </div>
          </Reveal>

          <div className="wis-stats" role="group" aria-label="O WIS em números">
            {METRICS.map((m) => (
              <div key={m.label} className="wis-stat">
                <b>{m.value}</b>
                <span>{m.label}</span>
              </div>
            ))}
          </div>

          {/* ── Como funciona ───────────────────────── */}
          <Reveal id="como-funciona">
            <div className="wis-steps-wrap">
              <p className="wis-kicker">{COMO_FUNCIONA.kicker}</p>
              <h2 className="wis-h2">{COMO_FUNCIONA.titulo}</h2>

              <div className="wis-steps">
                {COMO_FUNCIONA.passos.map((s) => (
                  <div key={s.n} className="wis-card wis-step">
                    <span className="wis-step-n" aria-hidden>{s.n}</span>
                    <h3>{s.title}</h3>
                    <p>{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Planos ───────────────────────────────────── */}
      <section id="planos" className="wis-section wis-section-plans">
        <div className="wis-wrap">
          <div className="wis-plans-head">
            <div>
              <p className="wis-kicker">{PLANOS.kicker}</p>
              <h2 className="wis-h2">{PLANOS.titulo}</h2>
            </div>

          </div>

          <div className="wis-plan-grid">
            {plans.map((plan, i) => (
              <PlanCard
                key={plan.key}
                plan={plan}
                tier={i}
                currency={currency}
                previousFeatures={i > 0 ? plans[i - 1].features : []}
                previousLabel={i > 0 ? plans[i - 1].label : null}
                adminOrgId={adminOrgId}
              />
            ))}
          </div>

          <p className="wis-plans-footer">{PLANOS.rodape}</p>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────── */}
      <section id="faq" className="wis-section">
        <div className="wis-wrap wis-faq-wrap">
          <Reveal>
            <p className="wis-kicker">{FAQ_TITULO.kicker}</p>
            <h2 className="wis-h2">{FAQ_TITULO.titulo}</h2>

            <div className="wis-faq">
              {FAQ.map((item) => <FaqItem key={item.q} {...item} />)}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Instalação PWA ───────────────────────────── */}
      <section className="wis-section">
        <div className="wis-wrap">
          <Reveal>
            <div className="wis-cta-panel">
              <div className="wis-cta-copy">
                <h2 className="wis-h2">
                  {INSTALACAO.titulo[0]} <span className="wis-muted">{INSTALACAO.titulo[1]}</span>
                </h2>
                <p>{INSTALACAO.texto}</p>

                <div className="wis-store-row">
                  <a href={APP_URL} target="_blank" rel="noopener noreferrer" className="wis-btn wis-btn-blue wis-btn-sm">
                    {INSTALACAO.entrarPwa} <ArrowUpRight size={16} />
                  </a>
                </div>
              </div>

              <div className="wis-cta-visual">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/screenshots/mobile-setlist.webp" alt="" loading="lazy" width={390} height={792} />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Rodapé ───────────────────────────────────── */}
      <footer className="wis-footer">
        <div className="wis-wrap wis-footer-grid">
          <div>
            <strong className="wis-footer-brand">WIS <span className="wis-accent">· Services</span></strong>
            <p>{FOOTER.descricao}</p>
          </div>
          <FooterCol title={FOOTER.colProduto} links={[
            { href: '#recursos', label: NAV_LABELS.recursos },
            { href: '#planos', label: NAV_LABELS.planos },
            { href: APP_URL, label: NAV_LABELS.entrarNaApp },
          ]} />
          <FooterCol title={FOOTER.colLegal} links={[
            { href: '/termos', label: FOOTER.termos },
            { href: '/privacidade', label: FOOTER.privacidade },
          ]} />
          <FooterCol title={FOOTER.colSuporte} links={[
            { href: '/suporte', label: FOOTER.centralAjuda },
            { href: `mailto:${SUPPORT_EMAIL}`, label: SUPPORT_EMAIL },
          ]} />
        </div>
        <p className="wis-copy">© {new Date().getUTCFullYear()} WIS - Services</p>
      </footer>
    </div>
  );
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <p className="wis-kicker wis-footer-kicker">{title}</p>
      {links.map((l) => <Link key={l.label} href={l.href}>{l.label}</Link>)}
    </div>
  );
}

// ── Cartão de plano ─────────────────────────────────────────────────────────

function PlanCard({ plan, tier, currency, previousFeatures, previousLabel, adminOrgId }: {
  plan: PlanDef; tier: number; currency: Currency;
  previousFeatures: string[]; previousLabel: string | null; adminOrgId: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const monthlyPrice = currency === 'BRL' ? plan.priceMonthlyBRL : plan.priceMonthly;
  const annualPrice = currency === 'BRL' ? plan.priceAnnualBRL : plan.priceAnnual;
  const savings = annualSavingsPercent(plan, currency);
  const popular = plan.key === 'colheita';

  async function handleAssinar() {
    if (!adminOrgId) return;
    setLoading(true);
    try {
      const result = await createCheckoutSessionAction(adminOrgId, plan.key, 'monthly', currency);
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

  // Só mostra o que o plano acrescenta ao anterior (os planos são cumulativos).
  const newFeatures = plan.features.filter((f) => !previousFeatures.includes(f));

  const limits = [
    { n: plan.maxPeople === null ? 'Ilimitadas' : String(plan.maxPeople), l: 'pessoas' },
    { n: plan.maxMinistries === null ? 'Ilimitados' : String(plan.maxMinistries), l: `ministério${plan.maxMinistries === 1 ? '' : 's'}` },
    { n: plan.maxLeaders === null ? 'Ilimitados' : String(plan.maxLeaders), l: `líder${plan.maxLeaders === 1 ? '' : 'es'}` },
  ];

  const ctaClass = `wis-btn ${popular ? 'wis-btn-blue' : 'wis-btn-outline'} wis-btn-block`;

  return (
    <div className={`wis-card wis-plan${popular ? ' is-featured' : ''}`} data-tier={tier}>
      {popular && <span className="wis-badge-pill">{PLANOS.recomendado}</span>}

      <h3 className="wis-plan-name">{plan.label}</h3>
      <p className="wis-plan-tagline">{AVISO_CHECKOUT[plan.key as keyof typeof AVISO_CHECKOUT] ?? ''}</p>

      <p className="wis-price">
        {fmtPrice(monthlyPrice, currency)}
        <small>/mês</small>
      </p>

      {monthlyPrice === 0 ? (
        <p className="wis-price-alt">Grátis</p>
      ) : (
        <p className="wis-price-alt">
          {`${fmtPrice(annualPrice, currency)} no plano anual`}
          {savings > 0 && <span className="wis-save-tag">{savings}% off</span>}
        </p>
      )}

      <ul className="wis-limits">
        {limits.map((x) => <li key={x.l}><span>{x.n}</span> <em>{x.l}</em></li>)}
      </ul>

      <ul className="wis-plan-features">
        {previousLabel && newFeatures.length > 0 && (
          <li className="wis-plan-inherits">Tudo do {previousLabel}, mais:</li>
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
        <Link href="/register" className={ctaClass}>
          {plan.priceMonthly === 0 ? 'Começar grátis' : 'Escolher plano'}
        </Link>
      ) : (
        <button type="button" onClick={handleAssinar} disabled={loading} className={ctaClass}>
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
    <div className={`wis-faq-item${open ? ' is-open' : ''}`}>
      <h3>
        <button
          type="button"
          className="wis-faq-q"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={`faq-${id}`}
        >
          {q}
          <ChevronDown size={18} aria-hidden />
        </button>
      </h3>
      {open && <p className="wis-faq-a" id={`faq-${id}`}>{a}</p>}
    </div>
  );
}
