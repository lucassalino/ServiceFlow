'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useOrgStore } from '@/stores/orgStore';
import type { UserProfile } from '@/types/models';
import {
  fetchProfileAction,
  updateProfileAction,
  deleteOwnAccountAction,
} from '@/actions/profile';

export function useProfile() {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: ['profile', user?.id],
    enabled: !!user?.id,
    queryFn: () => fetchProfileAction(),
  });
}

export interface UpdateProfilePayload {
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const { activeOrg, activeMembership, setActiveOrg } = useOrgStore();

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => updateProfileAction(payload),
    onSuccess: (updatedProfile) => {
      qc.setQueryData(['profile', user?.id], updatedProfile);
      if (activeOrg && activeMembership) {
        setActiveOrg(activeOrg, { ...activeMembership, profile: updatedProfile });
      }
    },
  });
}

export function useUploadAvatar() {
  const { user } = useAuthStore();
  return useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error('Sessão expirada');
      const supabase = createClient();
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      const path = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) throw new Error(uploadError.message);

      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      return `${data.publicUrl}?t=${Date.now()}`;
    },
  });
}

export function useDeleteAccount() {
  const signOutLocal = useAuthStore((s) => s.signOut);
  return useMutation({
    mutationFn: async () => {
      await deleteOwnAccountAction();
      const supabase = createClient();
      await supabase.auth.signOut({ scope: 'local' });
    },
    onSuccess: () => {
      signOutLocal();
    },
  });
}

export type { UserProfile };
