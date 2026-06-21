import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useOrgStore } from '@/stores/orgStore';
import { useAuthStore } from '@/stores/authStore';
import type { Event } from '@/types';

export function useEvents() {
  const { activeOrg } = useOrgStore();

  return useQuery({
    queryKey: ['events', activeOrg?.id],
    enabled: !!activeOrg?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('org_id', activeOrg!.id)
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (error) throw new Error(error.message);
      return data as Event[];
    },
  });
}

export function useEvent(eventId: string) {
  const { activeOrg } = useOrgStore();

  return useQuery({
    queryKey: ['event', eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) throw new Error(error.message);
      return data as Event;
    },
  });
}

export interface EventPayload {
  name: string;
  date: string;   // ISO date: "2025-06-15"
  time: string;   // "HH:MM:SS"
  location: string | null;
  color: string | null;
  description: string | null;
  observations: string | null;
}

export function useCreateEvent() {
  const qc = useQueryClient();
  const { activeOrg } = useOrgStore();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async (payload: EventPayload) => {
      const { data, error } = await supabase
        .from('events')
        .insert({ ...payload, org_id: activeOrg!.id, created_by: user!.id })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as Event;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['events', activeOrg?.id] });
    },
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  const { activeOrg } = useOrgStore();

  return useMutation({
    mutationFn: async ({ id, ...payload }: EventPayload & { id: string }) => {
      const { error } = await supabase
        .from('events')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw new Error(error.message);
    },
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: ['events', activeOrg?.id] });
      void qc.invalidateQueries({ queryKey: ['event', vars.id] });
    },
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  const { activeOrg } = useOrgStore();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['events', activeOrg?.id] });
    },
  });
}

export function usePublishEvent() {
  const qc = useQueryClient();
  const { activeOrg } = useOrgStore();

  return useMutation({
    mutationFn: async ({ id, publish }: { id: string; publish: boolean }) => {
      const { error } = await supabase
        .from('events')
        .update({ is_published: publish, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw new Error(error.message);
    },
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: ['events', activeOrg?.id] });
      void qc.invalidateQueries({ queryKey: ['event', vars.id] });
    },
  });
}
