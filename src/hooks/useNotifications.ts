'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import type { AppNotification } from '@/types/models';

export function useNotifications() {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: ['notifications', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('notifications')
        .select('*, event:events(id, name, date)')
        .eq('user_id', user!.id)
        .order('sent_at', { ascending: false })
        .limit(30);
      if (error) throw new Error(error.message);
      return data as AppNotification[];
    },
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
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications', user?.id] }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  return useMutation({
    mutationFn: async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user!.id)
        .eq('is_read', false);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications', user?.id] }),
  });
}

/**
 * Notifica todas as pessoas escaladas num evento (usado ao publicar a escala).
 * Cria uma notificação in-app para cada utilizador único com event_schedules
 * nesse evento.
 */
export function useNotifyEventSchedules() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventId, eventName }: { eventId: string; eventName: string }) => {
      const supabase = createClient();

      const { data: eventMinistries, error: emError } = await supabase
        .from('event_ministries')
        .select('id')
        .eq('event_id', eventId);
      if (emError) throw new Error(emError.message);

      const eventMinistryIds = (eventMinistries ?? []).map((em) => em.id);
      if (eventMinistryIds.length === 0) return { notified: 0 };

      const { data: schedules, error: schedulesError } = await supabase
        .from('event_schedules')
        .select('user_id')
        .in('event_ministry_id', eventMinistryIds);
      if (schedulesError) throw new Error(schedulesError.message);

      const userIds = Array.from(new Set((schedules ?? []).map((s) => s.user_id)));
      if (userIds.length === 0) return { notified: 0 };

      const message = `Foste escalado(a) para "${eventName}". Confirma a tua presença.`;
      const rows = userIds.map((userId) => ({
        user_id: userId,
        event_id: eventId,
        message,
      }));

      const { error: insertError } = await supabase.from('notifications').insert(rows);
      if (insertError) throw new Error(insertError.message);

      return { notified: userIds.length };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
