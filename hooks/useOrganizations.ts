import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type { OrganizationMember } from '@/types';

// Until Supabase types are generated, we use a typed Supabase client wrapper.
// These casts will be removed once `supabase gen types typescript` is run.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

// Fetch all organizations the current user belongs to
export function useOrgMemberships() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['org-memberships', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await db
        .from('organization_members')
        .select(`
          *,
          organization:organizations(*)
        `)
        .eq('user_id', user!.id)
        .eq('is_active', true);

      if (error) throw new Error(error.message);
      return data as OrganizationMember[];
    },
  });
}

// Join an org via invite code
export function useJoinOrganization() {
  const qc = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async (inviteCode: string) => {
      const { data: org, error: orgError } = await db
        .from('organizations')
        .select('id')
        .eq('invite_code', inviteCode)
        .single();

      if (orgError || !org) throw new Error('Código de convite inválido.');

      const { data: existing } = await db
        .from('organization_members')
        .select('id')
        .eq('org_id', org.id)
        .eq('user_id', user!.id)
        .single();

      if (existing) throw new Error('Já és membro desta organização.');

      const { error } = await db
        .from('organization_members')
        .insert({ org_id: org.id, user_id: user!.id, role: 'member', is_active: true });

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['org-memberships'] });
    },
  });
}

// Create a new organization (current user becomes admin)
export function useCreateOrganization() {
  const qc = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async (name: string) => {
      const inviteCode = Math.random().toString(36).slice(2, 8).toUpperCase();

      const { data: org, error: orgError } = await db
        .from('organizations')
        .insert({ name, invite_code: inviteCode })
        .select()
        .single();

      if (orgError || !org) throw new Error(orgError?.message ?? 'Erro ao criar organização.');

      const { error: memberError } = await db
        .from('organization_members')
        .insert({ org_id: org.id, user_id: user!.id, role: 'admin', is_active: true });

      if (memberError) throw new Error(memberError.message);

      await db
        .from('subscriptions')
        .insert({ org_id: org.id, plan: 'free', member_limit: 7, is_active: true });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['org-memberships'] });
    },
  });
}
