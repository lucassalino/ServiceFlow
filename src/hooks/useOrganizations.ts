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
      const { data, error } = await supabase.rpc('create_org_with_member', {
        org_name: name,
        invite_code: inviteCode,
        user_id: user.id,
      });
      if (error) throw new Error(error.message);
      const org = Array.isArray(data) ? data[0] : data;
      if (!org) throw new Error('Erro ao criar organização');
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

/**
 * Permite que um membro saia de uma organização. Bloqueia a saída
 * se for o único admin ativo, para evitar deixar a organização sem
 * ninguém com permissões de gestão.
 */
export function useLeaveOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orgId: string) => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: admins, error: adminsError } = await supabase
        .from('organization_members')
        .select('id, user_id')
        .eq('org_id', orgId)
        .eq('role', 'admin')
        .eq('is_active', true);
      if (adminsError) throw new Error(adminsError.message);

      const isOnlyAdmin = (admins ?? []).length === 1 && admins![0].user_id === user.id;
      if (isOnlyAdmin) {
        throw new Error(
          'Não podes saír: és o único administrador desta organização. Atribui outro admin primeiro.',
        );
      }

      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('org_id', orgId)
        .eq('user_id', user.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['org-memberships'] }),
  });
}
