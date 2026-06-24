'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useOrgStore } from '@/stores/orgStore';
import type { UserProfile } from '@/types/models';

export function useProfile() {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: ['profile', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single();
      if (error) throw new Error(error.message);
      return data as UserProfile;
    },
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
    mutationFn: async (payload: UpdateProfilePayload) => {
      const supabase = createClient();
      if (!user) throw new Error('Sessão expirada');
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', user.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as UserProfile;
    },
    onSuccess: (updatedProfile) => {
      qc.setQueryData(['profile', user?.id], updatedProfile);
      // Mantém a Sidebar (que lê de orgStore.activeMembership.profile)
      // sincronizada imediatamente, sem precisar de reload da página.
      if (activeOrg && activeMembership) {
        setActiveOrg(activeOrg, { ...activeMembership, profile: updatedProfile });
      }
    },
  });
}

/**
 * Faz upload de uma imagem para o bucket "avatars" na pasta do
 * próprio utilizador, e devolve o URL público. Substitui (upsert)
 * qualquer avatar anterior do mesmo utilizador.
 */
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
      // Acrescenta um cache-buster para o browser não mostrar a
      // imagem antiga em cache após substituir o avatar.
      return `${data.publicUrl}?t=${Date.now()}`;
    },
  });
}

/**
 * Elimina permanentemente a conta do utilizador autenticado, via
 * RPC que apaga apenas o próprio auth.uid(). Depois faz signOut
 * com scope "local": isto não contacta o servidor (que já não
 * reconhece o utilizador, por ter sido apagado), apenas limpa a
 * sessão guardada no browser. Ver supabase/supabase-js#1066 sobre
 * o erro que ocorre ao tentar um signOut "global" após apagar a
 * própria conta.
 */
export function useDeleteAccount() {
  const signOutLocal = useAuthStore((s) => s.signOut);
  return useMutation({
    mutationFn: async () => {
      const supabase = createClient();
      const { error } = await supabase.rpc('delete_own_account');
      if (error) throw new Error(error.message);
      await supabase.auth.signOut({ scope: 'local' });
    },
    onSuccess: () => {
      signOutLocal();
    },
  });
}
