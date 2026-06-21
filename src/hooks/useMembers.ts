'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useOrgStore } from '@/stores/orgStore';
import type { OrganizationMember, MinistryMember, OrgRole } from '@/types/models';

export function useOrgMembers() {
  const { activeOrg } = useOrgStore();
  return useQuery({
    queryKey: ['members', activeOrg?.id],
    enabled: !!activeOrg?.id,
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase.from('organization_members')
        .select('*, profile:profiles(*)').eq('org_id', activeOrg!.id).order('joined_at');
      if (error) throw new Error(error.message);
      return data as OrganizationMember[];
    },
  });
}

export function useMinistryMembers(ministryId: string | null) {
  return useQuery({
    queryKey: ['ministry-members', ministryId],
    enabled: !!ministryId,
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase.from('ministry_members')
        .select('*, profile:profiles(*)').eq('ministry_id', ministryId!).eq('is_active', true);
      if (error) throw new Error(error.message);
      return data as MinistryMember[];
    },
  });
}

export function useUpdateMemberRole() {
  const qc = useQueryClient();
  const { activeOrg } = useOrgStore();
  return useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: OrgRole }) => {
      const supabase = createClient();
      const { error } = await supabase.from('organization_members').update({ role }).eq('id', memberId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members', activeOrg?.id] }),
  });
}

export function useToggleMemberActive() {
  const qc = useQueryClient();
  const { activeOrg } = useOrgStore();
  return useMutation({
    mutationFn: async ({ memberId, isActive }: { memberId: string; isActive: boolean }) => {
      const supabase = createClient();
      const { error } = await supabase.from('organization_members').update({ is_active: isActive }).eq('id', memberId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members', activeOrg?.id] }),
  });
}
