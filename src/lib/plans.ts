/**
 * Catálogo de planos da plataforma WIS.
 *
 * Os limites são aplicados no código (server actions). `null` = ilimitado.
 * Preços a validar; o pagamento ainda NÃO está implementado — os planos são
 * atribuídos gratuitamente (source 'free') ou manualmente por um super-admin
 * ("permissão dev", source 'manual').
 */

export type PlanKey = 'semente' | 'crescimento' | 'comunhao' | 'expansao' | 'ilimitado';

export interface PlanDef {
  key: PlanKey;
  label: string;
  order: number;
  /** null = ilimitado */
  maxPeople: number | null;
  maxMinistries: number | null;
  maxAdmins: number | null;
  priceMonthly: { br: number; pt: number };
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
    priceMonthly: { br: 0, pt: 0 },
    features: ['Escala simples', 'Acesso do voluntário à app'],
  },
  crescimento: {
    key: 'crescimento',
    label: 'Crescimento',
    order: 1,
    maxPeople: 20,
    maxMinistries: 3,
    maxAdmins: 1,
    priceMonthly: { br: 34.9, pt: 6.99 },
    features: [
      'Aviso de indisponibilidade',
      'Notificações',
      'Calendário geral',
      'Histórico pessoal do voluntário',
    ],
  },
  comunhao: {
    key: 'comunhao',
    label: 'Comunhão',
    order: 2,
    maxPeople: 50,
    maxMinistries: null,
    maxAdmins: 1,
    priceMonthly: { br: 69.9, pt: 12.99 },
    features: [
      'Ministérios ilimitados',
      'Roteiro do evento',
      'Ranking de músicas',
      'Exportar em PDF',
      'Disponibilidade recorrente',
      'Sincronização com calendário',
    ],
  },
  expansao: {
    key: 'expansao',
    label: 'Expansão',
    order: 3,
    maxPeople: 100,
    maxMinistries: null,
    maxAdmins: null,
    priceMonthly: { br: 119.9, pt: 22.99 },
    features: [
      'Múltiplos administradores',
      'Lembretes automáticos por email',
      'Relatórios de engajamento',
    ],
  },
  ilimitado: {
    key: 'ilimitado',
    label: 'Ilimitado',
    order: 4,
    maxPeople: null,
    maxMinistries: null,
    maxAdmins: null,
    priceMonthly: { br: 199.9, pt: 39.99 },
    features: ['Sem limites', 'Multi-campus', 'Suporte prioritário'],
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
}
