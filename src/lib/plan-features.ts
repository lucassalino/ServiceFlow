/**
 * Funcionalidades booleanas por plano (gating "tem ou não tem").
 *
 * Complementa os limites por quantidade (check_plan_limit, migração 022).
 * A fonte de verdade é a coluna `plans.features` — mudar o que cada plano
 * inclui é um UPDATE, não um deploy. Aqui só vivem as chaves e os rótulos.
 */

export type PlanFeature =
  | 'member_history'
  | 'notifications'
  | 'recurring_unavailability'
  | 'calendar_sync'
  | 'event_timeline'
  | 'song_ranking'
  | 'pdf_export'
  | 'email_notifications'
  | 'engagement_reports'
  | 'priority_support';

/** Como cada funcionalidade se apresenta ao utilizador quando está bloqueada. */
export const FEATURE_INFO: Record<PlanFeature, { label: string; description: string }> = {
  member_history: {
    label: 'Histórico do voluntário',
    description: 'Ver o histórico de participações de cada pessoa.',
  },
  notifications: {
    label: 'Notificações',
    description: 'Avisar a equipa na app quando a escala é publicada.',
  },
  recurring_unavailability: {
    label: 'Disponibilidade recorrente',
    description: 'Regras como "toda a 2ª terça-feira do mês".',
  },
  calendar_sync: {
    label: 'Sincronização de calendário',
    description: 'Subscrever as escalas no Google ou Apple Calendar.',
  },
  event_timeline: {
    label: 'Roteiro do evento',
    description: 'Montar a ordem e os horários do culto.',
  },
  song_ranking: {
    label: 'Ranking de músicas',
    description: 'Ver as músicas mais tocadas.',
  },
  pdf_export: {
    label: 'Exportar em PDF',
    description: 'Guardar e imprimir a escala.',
  },
  email_notifications: {
    label: 'Avisos por email',
    description: 'Enviar a escala por email a quem foi escalado.',
  },
  engagement_reports: {
    label: 'Relatórios de engajamento',
    description: 'Frequência de participação e distribuição por ministério.',
  },
  priority_support: {
    label: 'Suporte prioritário',
    description: 'Resposta mais rápida da nossa equipa.',
  },
};

/** Estado do plano de uma organização. */
export interface PlanState {
  slug: string;
  name: string;
  features: PlanFeature[];
  /** true = plano concedido por nós, sem pagamento (source = 'manual'). */
  courtesy: boolean;
  source: string;
  status: string;
  expiresAt: string | null;
  billingCycle: string;
}

export const FREE_PLAN_STATE: PlanState = {
  slug: 'semente', name: 'Semente', features: [],
  courtesy: false, source: 'free', status: 'free',
  expiresAt: null, billingCycle: 'monthly',
};

export function hasFeature(state: PlanState | undefined, feature: PlanFeature): boolean {
  return !!state?.features.includes(feature);
}
