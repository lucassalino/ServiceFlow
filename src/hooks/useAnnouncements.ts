'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrgStore } from '@/stores/orgStore';
import type { Announcement } from '@/types/models';
import {
  fetchAnnouncementsAction,
  createAnnouncementAction,
  updateAnnouncementAction,
  deleteAnnouncementAction,
  type AnnouncementPayload,
} from '@/actions/announcements';

export function useAnnouncements() {
  const { activeOrg } = useOrgStore();
  return useQuery({
    queryKey: ['announcements', activeOrg?.id],
    enabled: !!activeOrg?.id,
    queryFn: () => fetchAnnouncementsAction(activeOrg!.id),
  });
}

export function useCreateAnnouncement() {
  const qc = useQueryClient();
  const { activeOrg } = useOrgStore();
  return useMutation({
    mutationFn: (payload: AnnouncementPayload) => createAnnouncementAction(activeOrg!.id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['announcements', activeOrg?.id] }),
  });
}

export function useUpdateAnnouncement() {
  const qc = useQueryClient();
  const { activeOrg } = useOrgStore();
  return useMutation({
    mutationFn: ({ id, ...payload }: AnnouncementPayload & { id: string }) => updateAnnouncementAction(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['announcements', activeOrg?.id] }),
  });
}

export function useDeleteAnnouncement() {
  const qc = useQueryClient();
  const { activeOrg } = useOrgStore();
  return useMutation({
    mutationFn: (id: string) => deleteAnnouncementAction(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['announcements', activeOrg?.id] }),
  });
}

export type { Announcement };
