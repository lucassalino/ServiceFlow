'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useOrgStore } from '@/stores/orgStore';
import type { Song } from '@/types/models';

export function useSongs() {
  const { activeOrg } = useOrgStore();
  return useQuery({
    queryKey: ['songs', activeOrg?.id],
    enabled: !!activeOrg?.id,
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase.from('songs')
        .select('*').eq('org_id', activeOrg!.id).order('name');
      if (error) throw new Error(error.message);
      return data as Song[];
    },
  });
}

export interface SongPayload {
  name: string; artist: string | null; musical_key: string | null;
  bpm: number | null; lyrics: string | null; chords: string | null; youtube_url: string | null;
}

export function useCreateSong() {
  const qc = useQueryClient();
  const { activeOrg } = useOrgStore();
  return useMutation({
    mutationFn: async (payload: SongPayload) => {
      const supabase = createClient();
      const { data, error } = await supabase.from('songs')
        .insert({ ...payload, org_id: activeOrg!.id }).select().single();
      if (error) throw new Error(error.message);
      return data as Song;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['songs', activeOrg?.id] }),
  });
}

export function useUpdateSong() {
  const qc = useQueryClient();
  const { activeOrg } = useOrgStore();
  return useMutation({
    mutationFn: async ({ id, ...payload }: SongPayload & { id: string }) => {
      const supabase = createClient();
      const { error } = await supabase.from('songs')
        .update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['songs', activeOrg?.id] }),
  });
}

export function useDeleteSong() {
  const qc = useQueryClient();
  const { activeOrg } = useOrgStore();
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase.from('songs').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['songs', activeOrg?.id] }),
  });
}
