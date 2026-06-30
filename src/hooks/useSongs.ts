'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrgStore } from '@/stores/orgStore';
import type { Song } from '@/types/models';
import {
  fetchSongsAction,
  createSongAction,
  updateSongAction,
  deleteSongAction,
  type SongPayload,
} from '@/actions/songs';

export type { SongPayload };

export function useSongs() {
  const { activeOrg } = useOrgStore();
  return useQuery({
    queryKey: ['songs', activeOrg?.id],
    enabled: !!activeOrg?.id,
    queryFn: () => fetchSongsAction(activeOrg!.id),
  });
}

export function useCreateSong() {
  const qc = useQueryClient();
  const { activeOrg } = useOrgStore();
  return useMutation({
    mutationFn: (payload: SongPayload) =>
      createSongAction(activeOrg!.id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['songs', activeOrg?.id] }),
  });
}

export function useUpdateSong() {
  const qc = useQueryClient();
  const { activeOrg } = useOrgStore();
  return useMutation({
    mutationFn: ({ id, ...payload }: SongPayload & { id: string }) =>
      updateSongAction(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['songs', activeOrg?.id] }),
  });
}

export function useDeleteSong() {
  const qc = useQueryClient();
  const { activeOrg } = useOrgStore();
  return useMutation({
    mutationFn: (id: string) => deleteSongAction(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['songs', activeOrg?.id] }),
  });
}

export type { Song };
