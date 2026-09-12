/**
 * Catálogo de planos da plataforma WIS.
 *
 * A TABELA `plans` no Supabase é a fonte de verdade (migração 022 + 028).
 * Este ficheiro é só o fallback de UI — os valores têm de bater certo com
 * a base de dados. Se mudares um preço/limite, muda os dois sítios (ou,
 * melhor ainda, lê sempre via fetchPlanStateAction/RPC em vez deste catálogo
 * estático quando precisares do valor exato de uma organização real).
 *
 * O pagamento ainda NÃO está implementado — os planos são atribuídos
 * gratuitamente (source 'free') ou manualmente por um super-admin
 * ("permissão dev", source 'manual').
 */

export type PlanKey = 'semente' | 'broto' | 'colheita';

export interface PlanDef {
  key: PlanKey;
  label: string;
  order: number;
  /** null = ilimitado */
  maxPeople: number | null;
  maxMinistries: number | null;
  /** Sempre 1, em qualquer plano — só o número de líderes varia. */
  maxAdmins: number | null;
  /** null = ilimitado. 0 = plano não inclui líderes (só o admin). */
  maxLeaders: number | null;
  /** Preços em euros. */
  priceMonthly: number;
  priceAnnual: number;
  /** Preços em reais — não é a conversão direta do EUR, ver AGENTS.md. */
  priceMonthlyBRL: number;
  priceAnnualBRL: number;
  features: string[];
}

export const PLANS: Record<PlanKey, PlanDef> = {
  semente: {
    key: 'semente',
    label: 'Semente',
    order: 0,
    maxPeople: 10,
    maxMinistries: 1,
    maxAdmins: 1,
    maxLeaders: 0,
    priceMonthly: 0,
    priceAnnual: 0,
    priceMonthlyBRL: 0,
    priceAnnualBRL: 0,
    features: ['Escala simples', 'Acesso do voluntário à app'],
  },
  broto: {
    key: 'broto',
    label: 'Plus',
    order: 1,
    maxPeople: 25,
    maxMinistries: 5,
    maxAdmins: 1,
    maxLeaders: 1,
    priceMonthly: 9.99,
    priceAnnual: 99.90,
    priceMonthlyBRL: 49.90,
    priceAnnualBRL: 499.90,
    features: [
      'Histórico de participações do voluntário',
      'Notificações na app',
    ],
  },
  colheita: {
    key: 'colheita',
    label: 'Pro',
    order: 2,
    maxPeople: null,
    maxMinistries: null,
    maxAdmins: 1,
    maxLeaders: null,
    priceMonthly: 25.99,
    priceAnnual: 259.90,
    priceMonthlyBRL: 99.90,
    priceAnnualBRL: 999.90,
    features: [
      'Pessoas, ministérios e líderes ilimitados',
      'Disponibilidade recorrente (ex.: "2ª terça do mês")',
      'Sincronização com o Google/Apple Calendar',
      'Roteiro do evento',
      'Ranking de músicas',
      'Exportar em PDF',
      'Avisos por email quando a escala é publicada',
      'Relatórios de engajamento',
      'Suporte prioritário',
    ],
  },
};

export const PLAN_LIST: PlanDef[] = Object.values(PLANS).sort((a, b) => a.order - b.order);

export const DEFAULT_PLAN: PlanKey = 'semente';

export function getPlan(key: string | null | undefined): PlanDef {
  return PLANS[(key as PlanKey)] ?? PLANS[DEFAULT_PLAN];
}

/** true se `n` está dentro do limite (`limit` null = ilimitado). */
export function withinLimit(n: number, limit: number | null): boolean {
  return limit === null || n < limit;
}

export type Currency = 'EUR' | 'BRL';

/** Poupança (%) de escolher o preço anual em vez de 12x o mensal. */
export function annualSavingsPercent(plan: PlanDef, currency: Currency = 'EUR'): number {
  const monthly = currency === 'BRL' ? plan.priceMonthlyBRL : plan.priceMonthly;
  const annual = currency === 'BRL' ? plan.priceAnnualBRL : plan.priceAnnual;
  if (monthly === 0) return 0;
  const fullYear = monthly * 12;
  return Math.round((1 - annual / fullYear) * 100);
}

/**
 * Deteta se o visitante deve ver preços em BRL por omissão, a partir do
 * locale do navegador (pt-BR, ou qualquer idioma com região BR). O
 * utilizador pode sempre trocar manualmente na página de planos.
 */
export function detectDefaultCurrency(): Currency {
  if (typeof navigator === 'undefined') return 'EUR';
  const locales = navigator.languages && navigator.languages.length > 0 ? navigator.languages : [navigator.language];
  for (const loc of locales) {
    if (!loc) continue;
    if (/-BR$/i.test(loc) || loc.toUpperCase() === 'BR') return 'BRL';
  }
  return 'EUR';
}

export interface OrgSubscription {
  id: string;
  org_id: string;
  plan: PlanKey;
  source: 'free' | 'manual' | 'coupon' | 'stripe';
  status: 'active' | 'expired' | 'canceled';
  started_at: string;
  expires_at: string | null;
  granted_by: string | null;
  note: string | null;
  /** true se a org já tem um customer no Stripe (já passou por um checkout). */
  has_stripe_customer: boolean;
}
