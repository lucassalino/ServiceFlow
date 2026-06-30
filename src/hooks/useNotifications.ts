'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import type { AppNotification } from '@/types/models';
import {
  fetchNotificationsAction,
  markNotificationReadAction,
  markAllNotificationsReadAction,
  notifyEventSchedulesAction,
} from '@/actions/notifications';

export function useNotifications() {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: ['notifications', user?.id],
    enabled: !!user?.id,
    queryFn: () => fetchNotificationsAction(),
  });
}

export function useUnreadNotificationCount() {
  const { data: notifications = [] } = useNotifications();
  return notifications.filter((n) => !n.is_read).length;
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  return useMutation({
    mutationFn: (id: string) => markNotificationReadAction(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications', user?.id] }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  return useMutation({
    mutationFn: () => markAllNotificationsReadAction(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications', user?.id] }),
  });
}

export function useNotifyEventSchedules() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, eventName }: { eventId: string; eventName: string }) =>
      notifyEventSchedulesAction(eventId, eventName),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export type { AppNotification };
