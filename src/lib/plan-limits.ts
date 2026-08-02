/**
 * Tipos partilhados do sistema de limites de plano.
 *
 * IMPORTANTE — porque não lançamos erros:
 * O Next.js apaga as mensagens de Error em builds de produção ("The specific
 * message is omitted in production builds"). Por isso as server actions
 * DEVOLVEM um resultado estruturado em vez de lançar, para o cliente poder
 * distinguir "limite atingido" de um erro genérico e abrir o modal certo.
 */

export type PlanResource = 'people' | 'ministry' | 'admin' | 'leader';

/** Estado do limite para um recurso. `limit: null` = ilimitado. */
export interface PlanLimitState {
  allowed: boolean;
  used: number;
  limit: number | null;
  planSlug: string;
  planName: string;
}

export const PLAN_LIMIT_CODE = 'PLAN_LIMIT_REACHED' as const;

/** Resultado de uma ação que pode ser bloqueada pelo limite do plano. */
export type PlanGuarded<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      code: typeof PLAN_LIMIT_CODE;
      resource: PlanResource;
      used: number;
      limit: number | null;
      planName: string;
    };

/**
 * Erro tipado de limite de plano.
 *
 * É construído no CLIENTE (dentro dos hooks) a partir do resultado devolvido
 * pela server action — nunca atravessa a fronteira servidor→cliente como Error,
 * por isso o payload chega sempre intacto, mesmo em produção.
 */
export class PlanLimitError extends Error {
  readonly code = PLAN_LIMIT_CODE;
  readonly resource: PlanResource;
  readonly used: number;
  readonly limit: number | null;
  readonly planName: string;

  constructor(info: {
    resource: PlanResource; used: number; limit: number | null; planName: string;
  }) {
    super(PLAN_LIMIT_CODE);
    this.name = 'PlanLimitError';
    this.resource = info.resource;
    this.used = info.used;
    this.limit = info.limit;
    this.planName = info.planName;
  }
}

export function isPlanLimitError(e: unknown): e is PlanLimitError {
  return e instanceof PlanLimitError;
}

/** Converte o resultado de uma action em dados, ou lança PlanLimitError. */
export function unwrapPlanGuarded<T>(result: PlanGuarded<T>): T {
  if (result.ok) return result.data;
  throw new PlanLimitError({
    resource: result.resource,
    used: result.used,
    limit: result.limit,
    planName: result.planName,
  });
}

/** Rótulo legível de cada recurso (singular / plural). */
export const RESOURCE_LABEL: Record<PlanResource, { one: string; many: string }> = {
  people: { one: 'pessoa', many: 'pessoas' },
  ministry: { one: 'ministério', many: 'ministérios' },
  admin: { one: 'administrador', many: 'administradores' },
  leader: { one: 'líder', many: 'líderes' },
};

/** Percentagem de utilização (0–100). Ilimitado devolve 0. */
export function usagePercent(state: Pick<PlanLimitState, 'used' | 'limit'>): number {
  if (state.limit === null || state.limit <= 0) return 0;
  return Math.min(100, Math.round((state.used / state.limit) * 100));
}

/** Limiar a partir do qual mostramos o aviso de "perto do limite". */
export const NEAR_LIMIT_THRESHOLD = 80;

/** true se está perto do limite (≥80%) mas ainda não o atingiu. */
export function isNearLimit(state: Pick<PlanLimitState, 'used' | 'limit'>): boolean {
  if (state.limit === null) return false;
  const pct = usagePercent(state);
  return pct >= NEAR_LIMIT_THRESHOLD && state.used < state.limit;
}

/** true se o limite já foi atingido ou ultrapassado. */
export function isAtLimit(state: Pick<PlanLimitState, 'used' | 'limit'>): boolean {
  if (state.limit === null) return false;
  return state.used >= state.limit;
}
