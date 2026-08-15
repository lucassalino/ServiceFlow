'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchMyCheckinStatusAction, checkInSelfAction, checkInWithScanAction, fetchTodayCheckinOverviewAction,
  type CheckinStatus, type CheckinOverviewEvent,
} from '@/actions/checkin';

export function useMyCheckinStatus(orgId: string | null) {
  return useQuery({
    queryKey: ['my-checkin-status', orgId],
    enabled: !!orgId,
    queryFn: () => fetchMyCheckinStatusAction(orgId!),
    refetchOnWindowFocus: true,
  });
}

export function useCheckInSelf(orgId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ scheduleId, checkedIn }: { scheduleId: string; checkedIn: boolean }) =>
      checkInSelfAction(scheduleId, checkedIn),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-checkin-status', orgId] });
      qc.invalidateQueries({ queryKey: ['event-schedules'] });
      qc.invalidateQueries({ queryKey: ['today-checkin-overview', orgId] });
    },
  });
}

/** [DESATIVADO por agora — fluxo de QR/câmara comentado na UI.] */
export function useCheckInWithScan(orgId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ scheduleId, checkedIn, scannedText }: {
      scheduleId: string; checkedIn: boolean; scannedText: string;
    }) => checkInWithScanAction(scheduleId, checkedIn, scannedText),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-checkin-status', orgId] });
      qc.invalidateQueries({ queryKey: ['event-schedules'] });
    },
  });
}

export function useTodayCheckinOverview(orgId: string | null) {
  return useQuery({
    queryKey: ['today-checkin-overview', orgId],
    enabled: !!orgId,
    queryFn: () => fetchTodayCheckinOverviewAction(orgId!),
    refetchInterval: 30_000,
  });
}

export type { CheckinStatus, CheckinOverviewEvent };
