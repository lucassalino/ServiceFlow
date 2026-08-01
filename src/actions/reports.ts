'use server';

import { createClient } from '@/lib/supabase/server';

/**
 * Relatório de engajamento por organização.
 *
 * A agregação vive na RPC `org_engagement_report` (ver migração 026), que
 * também valida a permissão (admin/líder) a partir de auth.uid() — por isso
 * usamos o cliente do UTILIZADOR e não o service-role.
 */

export interface EngagementSummary {
  events: number;
  assignments: number;
  people: number;
  confirmed: number;
  declined: number;
  /** Escalas a que a pessoa nunca respondeu. NÃO são faltas. */
  pending: number;
}

export interface EngagementPerson {
  user_id: string;
  name: string;
  avatar_url: string | null;
  assignments: number;
  confirmed: number;
  declined: number;
  pending: number;
  ministries: number;
  last_served: string | null;
}

export interface EngagementMinistry {
  ministry_id: string;
  name: string;
  icon: string;
  color: string;
  assignments: number;
  people: number;
  events: number;
}

export interface EngagementInactive {
  user_id: string;
  name: string;
  avatar_url: string | null;
}

export interface EngagementReport {
  summary: EngagementSummary;
  people: EngagementPerson[];
  ministries: EngagementMinistry[];
  /** Membros ativos que não serviram no período. */
  inactive_people: EngagementInactive[];
}

const EMPTY: EngagementReport = {
  summary: { events: 0, assignments: 0, people: 0, confirmed: 0, declined: 0, pending: 0 },
  people: [], ministries: [], inactive_people: [],
};

export async function fetchEngagementReportAction(
  orgId: string,
  from: string,
  to: string,
  ministryId?: string | null,
): Promise<EngagementReport> {
  const supabase = await createClient();
  // Os tipos gerados ainda não incluem esta RPC (ver migração 026).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rpc = supabase.rpc.bind(supabase) as any;

  const { data, error } = await rpc('org_engagement_report', {
    p_org_id: orgId,
    p_from: from,
    p_to: to,
    p_ministry_id: ministryId ?? null,
  });
  if (error) throw new Error(error.message);
  if (!data) return EMPTY;

  const r = data as Partial<EngagementReport>;
  return {
    summary: r.summary ?? EMPTY.summary,
    people: r.people ?? [],
    ministries: r.ministries ?? [],
    inactive_people: r.inactive_people ?? [],
  };
}
