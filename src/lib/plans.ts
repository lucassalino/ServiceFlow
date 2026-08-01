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

export type PlanKey = 'semente' | 'broto' | 'colheita' | 'celeiro';

export interface PlanDef {
  key: PlanKey;
  label: string;
  order: number;
  /** null = ilimitado */
  maxPeople: number | null;
  maxMinistries: number | null;
  maxAdmins: number | null;
  /** Preços em euros. */
  priceMonthly: number;
  priceAnnual: number;
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
    priceMonthly: 0,
    priceAnnual: 0,
    features: ['Escala simples', 'Acesso do voluntário à app'],
  },
  broto: {
    key: 'broto',
    label: 'Broto',
    order: 1,
    maxPeople: 25,
    maxMinistries: 5,
    maxAdmins: 1,
    priceMonthly: 9.99,
    priceAnnual: 99.90,
    features: [
      'Histórico de participações do voluntário',
      'Notificações na app',
    ],
  },
  colheita: {
    key: 'colheita',
    label: 'Colheita',
    order: 2,
    maxPeople: 60,
    maxMinistries: null,
    maxAdmins: 3,
    priceMonthly: 19.99,
    priceAnnual: 199.90,
    features: [
      'Ministérios ilimitados',
      'Disponibilidade recorrente (ex.: "2ª terça do mês")',
      'Sincronização com o Google/Apple Calendar',
      'Roteiro do evento',
      'Ranking de músicas',
      'Exportar em PDF',
    ],
  },
  celeiro: {
    key: 'celeiro',
    label: 'Celeiro',
    order: 3,
    maxPeople: null,
    maxMinistries: null,
    maxAdmins: null,
    priceMonthly: 39.99,
    priceAnnual: 399.90,
    features: [
      'Pessoas e administradores ilimitados',
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

/** Poupança (%) de escolher o preço anual em vez de 12x o mensal. */
export function annualSavingsPercent(plan: PlanDef): number {
  if (plan.priceMonthly === 0) return 0;
  const fullYear = plan.priceMonthly * 12;
  return Math.round((1 - plan.priceAnnual / fullYear) * 100);
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
