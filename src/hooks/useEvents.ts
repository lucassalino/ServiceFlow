'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useOrgStore } from '@/stores/orgStore';
import type { Event } from '@/types/models';

export function useEvents() {
  const { activeOrg } = useOrgStore();
  return useQuery({
    queryKey: ['events', activeOrg?.id],
    enabled: !!activeOrg?.id,
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase.from('events')
        .select('*').eq('org_id', activeOrg!.id)
        .order('date', { ascending: true }).order('time', { ascending: true });
      if (error) throw new Error(error.message);
      return data as Event[];
    },
  });
}

export interface EventPayload {
  name: string; date: string; time: string;
  location: string | null; color: string | null;
  description: string | null; observations: string | null;
}

export function useCreateEvent() {
  const qc = useQueryClient();
  const { activeOrg } = useOrgStore();
  return useMutation({
    mutationFn: async (payload: EventPayload) => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase.from('events')
        .insert({ ...payload, org_id: activeOrg!.id, created_by: user!.id })
        .select().single();
      if (error) throw new Error(error.message);
      return data as Event;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events', activeOrg?.id] }),
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  const { activeOrg } = useOrgStore();
  return useMutation({
    mutationFn: async ({ id, ...payload }: EventPayload & { id: string }) => {
      const supabase = createClient();
      const { error } = await supabase.from('events')
        .update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events', activeOrg?.id] }),
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  const { activeOrg } = useOrgStore();
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events', activeOrg?.id] }),
  });
}

export function usePublishEvent() {
  const qc = useQueryClient();
  const { activeOrg } = useOrgStore();
  return useMutation({
    mutationFn: async ({ id, publish }: { id: string; publish: boolean }) => {
      const supabase = createClient();
      const { error } = await supabase.from('events')
        .update({ is_published: publish, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events', activeOrg?.id] }),
  });
}
