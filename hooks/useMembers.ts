import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useOrgStore } from '@/stores/orgStore';
import type { OrganizationMember, MemberFunction } from '@/types';

// All members of the active org with their profiles
export function useOrgMembers() {
  const { activeOrg } = useOrgStore();

  return useQuery({
    queryKey: ['org-members', activeOrg?.id],
    enabled: !!activeOrg?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization_members')
        .select('*, profile:profiles(*)')
        .eq('org_id', activeOrg!.id)
        .order('joined_at');

      if (error) throw new Error(error.message);
      return data as OrganizationMember[];
    },
  });
}

// Members of a specific ministry
export function useMinistryMembers(ministryId: string) {
  return useQuery({
    queryKey: ['ministry-members', ministryId],
    enabled: !!ministryId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ministry_members')
        .select('*, profile:profiles(*)')
        .eq('ministry_id', ministryId)
        .eq('is_active', true);

      if (error) throw new Error(error.message);
      return data;
    },
  });
}

interface UpdateMemberRoleArgs {
  memberId: string;
  role: 'admin' | 'leader' | 'member';
}

export function useUpdateMemberRole() {
  const qc = useQueryClient();
  const { activeOrg } = useOrgStore();

  return useMutation({
    mutationFn: async ({ memberId, role }: UpdateMemberRoleArgs) => {
      const { error } = await supabase
        .from('organization_members')
        .update({ role })
        .eq('id', memberId);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['org-members', activeOrg?.id] });
    },
  });
}

export function useToggleMemberActive() {
  const qc = useQueryClient();
  const { activeOrg } = useOrgStore();

  return useMutation({
    mutationFn: async ({ memberId, isActive }: { memberId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('organization_members')
        .update({ is_active: isActive })
        .eq('id', memberId);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['org-members', activeOrg?.id] });
    },
  });
}

interface AddToMinistryArgs {
  ministryId: string;
  userId: string;
  functions: MemberFunction[];
}

export function useAddMemberToMinistry() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ ministryId, userId, functions }: AddToMinistryArgs) => {
      const { error } = await supabase
        .from('ministry_members')
        .upsert({ ministry_id: ministryId, user_id: userId, functions, is_active: true });

      if (error) throw new Error(error.message);
    },
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: ['ministry-members', vars.ministryId] });
    },
  });
}

export function useRemoveMemberFromMinistry() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ ministryId, userId }: { ministryId: string; userId: string }) => {
      const { error } = await supabase
        .from('ministry_members')
        .delete()
        .eq('ministry_id', ministryId)
        .eq('user_id', userId);

      if (error) throw new Error(error.message);
    },
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: ['ministry-members', vars.ministryId] });
    },
  });
}
