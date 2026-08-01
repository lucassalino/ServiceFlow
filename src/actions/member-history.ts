'use server';

import { createClient } from '@/lib/supabase/server';

/**
 * Histórico de participações de uma pessoa.
 *
 * A lógica (join + permissão) vive nas RPCs `fetch_member_history` e
 * `fetch_member_history_summary`. Usamos o cliente do UTILIZADOR (não o
 * service-role) porque as RPCs decidem a permissão a partir de auth.uid().
 */

export interface MemberHistoryEntry {
  eventId: string;
  eventName: string;
  eventDate: string;      // YYYY-MM-DD
  eventTime: string | null;
  ministryId: string;
  ministryName: string;
  ministryIcon: string;
  ministryColor: string;
  functions: string[];
  /** true = confirmou · false = recusou · null = nunca respondeu */
  confirmed: boolean | null;
}

export interface MemberHistorySummary {
  total: number;
  confirmed: number;
  declined: number;
  pending: number;
  ministries: number;
  firstServed: string | null;
  lastServed: string | null;
}

export interface MemberHistory {
  entries: MemberHistoryEntry[];
  summary: MemberHistorySummary;
}

const EMPTY_SUMMARY: MemberHistorySummary = {
  total: 0, confirmed: 0, declined: 0, pending: 0,
  ministries: 0, firstServed: null, lastServed: null,
};

export async function fetchMemberHistoryAction(
  orgId: string,
  userId: string,
  opts?: { limit?: number; offset?: number },
): Promise<MemberHistory> {
  const supabase = await createClient();
  // Os tipos gerados ainda não incluem estas RPCs (ver migração 023).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rpc = supabase.rpc.bind(supabase) as any;

  const [rowsRes, summaryRes] = await Promise.all([
    rpc('fetch_member_history', {
      p_org_id: orgId,
      p_user_id: userId,
      p_limit: opts?.limit ?? 50,
      p_offset: opts?.offset ?? 0,
    }),
    rpc('fetch_member_history_summary', {
      p_org_id: orgId,
      p_user_id: userId,
    }),
  ]);

  if (rowsRes.error) throw new Error(rowsRes.error.message);
  if (summaryRes.error) throw new Error(summaryRes.error.message);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (rowsRes.data ?? []) as any[];
  const entries: MemberHistoryEntry[] = rows.map((r) => ({
    eventId: r.event_id,
    eventName: r.event_name,
    eventDate: r.event_date,
    eventTime: r.event_time ?? null,
    ministryId: r.ministry_id,
    ministryName: r.ministry_name,
    ministryIcon: r.ministry_icon,
    ministryColor: r.ministry_color,
    functions: r.functions ?? [],
    confirmed: r.confirmed ?? null,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = (Array.isArray(summaryRes.data) ? summaryRes.data[0] : summaryRes.data) as any;
  const summary: MemberHistorySummary = s
    ? {
        total: s.total ?? 0,
        confirmed: s.confirmed ?? 0,
        declined: s.declined ?? 0,
        pending: s.pending ?? 0,
        ministries: s.ministries ?? 0,
        firstServed: s.first_served ?? null,
        lastServed: s.last_served ?? null,
      }
    : EMPTY_SUMMARY;

  return { entries, summary };
}
