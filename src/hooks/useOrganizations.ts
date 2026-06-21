'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { Organization, OrganizationMember } from '@/types/models';

export function useOrgMemberships() {
  return useQuery({
    queryKey: ['org-memberships'],
    queryFn: async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from('organization_members')
        .select('*, organization:organizations(*)')
        .eq('user_id', user.id).eq('is_active', true);
      if (error) throw new Error(error.message);
      return data as (OrganizationMember & { organization: Organization })[];
    },
  });
}

export function useCreateOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const { data: org, error: orgError } = await supabase
        .from('organizations').insert({ name, invite_code: inviteCode })
        .select().single();
      if (orgError) throw new Error(orgError.message);
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({ org_id: org.id, user_id: user.id, role: 'admin', is_active: true });
      if (memberError) throw new Error(memberError.message);
      // subscriptions table managed separately
      return org as Organization;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['org-memberships'] }),
  });
}

export function useJoinOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (inviteCode: string) => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data: org, error: orgError } = await supabase
        .from('organizations').select().eq('invite_code', inviteCode.toUpperCase()).single();
      if (orgError || !org) throw new Error('Código de convite inválido');
      const { error } = await supabase
        .from('organization_members')
        .insert({ org_id: org.id, user_id: user.id, role: 'member', is_active: true });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['org-memberships'] }),
  });
}
