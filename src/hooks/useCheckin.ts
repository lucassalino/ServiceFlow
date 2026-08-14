'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchMyCheckinStatusAction, checkInWithLocationAction, type CheckinStatus } from '@/actions/checkin';
import { updateOrgCheckinLocationAction } from '@/actions/organizations';

export function useMyCheckinStatus(orgId: string | null) {
  return useQuery({
    queryKey: ['my-checkin-status', orgId],
    enabled: !!orgId,
    queryFn: () => fetchMyCheckinStatusAction(orgId!),
    refetchOnWindowFocus: true,
  });
}

export function useCheckInWithLocation(orgId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ scheduleId, checkedIn, location }: {
      scheduleId: string; checkedIn: boolean; location: { latitude: number; longitude: number } | null;
    }) => checkInWithLocationAction(scheduleId, checkedIn, location),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-checkin-status', orgId] });
      qc.invalidateQueries({ queryKey: ['event-schedules'] });
    },
  });
}

export function useUpdateOrgCheckinLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, ...payload }: { orgId: string; latitude: number; longitude: number; radiusMeters: number }) =>
      updateOrgCheckinLocationAction(orgId, payload),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['org-memberships'] });
      qc.invalidateQueries({ queryKey: ['my-checkin-status', vars.orgId] });
    },
  });
}

export type { CheckinStatus };
